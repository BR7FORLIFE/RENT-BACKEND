import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service.js';
import { SystemPropertyService } from '../../system-property-role/services/system-property.service.js';
import {
  ServiceRequestRepository,
  type HistoryEntry,
} from '../repository/service-request.repository.js';
import { ServiceOfferingRepository } from '../repository/service-offering.repository.js';
import { ServiceNotifier } from './service-notifier.service.js';
import {
  POLICIES_STATEMENTS_NAMES,
  type AuthUser,
} from '../../../types/global-types.js';
import type {
  CreateServiceRequestType,
  ListServiceRequestsQueryType,
  ProposePriceType,
  ServiceRequestActionType,
} from '../dtos/request-dto.js';
import {
  ServiceOfferingNotFound,
  ServiceOfferingUnavailable,
  ServiceRequestActorNotAllowed,
  ServiceRequestConcurrentUpdate,
  ServiceRequestInvalid,
  ServiceRequestInvalidTransition,
  ServiceRequestNotFound,
  ServiceRequestPriceNotAgreed,
} from '../exceptions/exceptions.js';

type RequestStatus =
  | 'REQUESTED'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

type FullRequest = NonNullable<
  Awaited<ReturnType<ServiceRequestRepository['findById']>>
>;

/**
 * Maquina de estados (solo estas transiciones, cada una con su propio endpoint):
 *   REQUESTED   -> ACCEPTED | REJECTED | CANCELLED
 *   ACCEPTED    -> IN_PROGRESS | CANCELLED
 *   IN_PROGRESS -> COMPLETED | CANCELLED (solo el proveedor)
 * Accept/reject/start/complete: proveedor asignado. Cancelacion: ver `cancel`.
 * El servicio se da por completado por el proveedor (no hay confirmacion del cliente: el enum
 * no tiene un estado intermedio y no se asume uno); el cliente recibe la notificacion.
 */
@Injectable()
export class ServiceRequestService {
  constructor(
    private readonly prismaClient: PrismaService,
    private readonly requestRepository: ServiceRequestRepository,
    private readonly offeringRepository: ServiceOfferingRepository,
    private readonly systemRole: SystemPropertyService,
    private readonly notifier: ServiceNotifier,
  ) {}

  // ---------------- consultas ----------------

  async findMine(user: AuthUser, query: ListServiceRequestsQueryType) {
    return await this.requestRepository.findAll(
      { requestedByUserId: user.userId },
      query,
    );
  }

  async findReceived(user: AuthUser, query: ListServiceRequestsQueryType) {
    return await this.requestRepository.findAll(
      { providerUserId: user.userId },
      query,
    );
  }

  async findByProperty(
    user: AuthUser,
    propertyId: string,
    query: ListServiceRequestsQueryType,
  ) {
    const member =
      await this.systemRole.verifyPropertyMemberByUserIdInPropertyId(
        user.userId,
        propertyId,
      );
    await this.systemRole.CheckPolicies(member.id, [
      POLICIES_STATEMENTS_NAMES.VER_SOLICITUDES_SERVICIOS,
    ]);

    return await this.requestRepository.findAll({ propertyId }, query);
  }

  // solicitudes propias, recibidas, o de inmuebles donde el usuario puede verlas
  async findAccessible(user: AuthUser, query: ListServiceRequestsQueryType) {
    const propertyIds = await this.systemRole.getPropertyIdsWithPolicies(
      user.userId,
      [POLICIES_STATEMENTS_NAMES.VER_SOLICITUDES_SERVICIOS],
    );

    return await this.requestRepository.findAll(
      {
        OR: [
          { requestedByUserId: user.userId },
          { providerUserId: user.userId },
          { propertyId: { in: propertyIds } },
        ],
      },
      query,
    );
  }

  async findById(user: AuthUser, id: string) {
    const request = await this.requestRepository.findById(id);
    if (!request) throw new ServiceRequestNotFound();

    const isParty = this.isParty(user.userId, request);
    if (
      !isParty &&
      !(await this.systemRole.hasPoliciesInProperty(
        user.userId,
        request.propertyId,
        [POLICIES_STATEMENTS_NAMES.VER_SOLICITUDES_SERVICIOS],
      ))
    ) {
      // 404 para no revelar la existencia de solicitudes ajenas
      throw new ServiceRequestNotFound();
    }
    return request;
  }

  // ---------------- creacion ----------------

  async create(user: AuthUser, dto: CreateServiceRequestType) {
    // 1. permisos sobre el inmueble
    const member =
      await this.systemRole.verifyPropertyMemberByUserIdInPropertyId(
        user.userId,
        dto.propertyId,
      );
    await this.systemRole.CheckPolicies(member.id, [
      POLICIES_STATEMENTS_NAMES.SOLICITAR_SERVICIOS,
    ]);

    // 2. oferta, servicio y vigencia
    const offering = await this.offeringRepository.findById(
      dto.serviceOfferingId,
    );
    if (!offering) throw new ServiceOfferingNotFound();

    const now = new Date();
    if (offering.status !== 'ACTIVE') {
      throw new ServiceOfferingUnavailable('la oferta esta inactiva');
    }
    if (!offering.service.isActive) {
      throw new ServiceOfferingUnavailable('el servicio esta inactivo');
    }
    if (offering.validFrom > now) {
      throw new ServiceOfferingUnavailable('aun no inicia su vigencia');
    }
    if (offering.validUntil && offering.validUntil < now) {
      throw new ServiceOfferingUnavailable('su vigencia ha vencido');
    }

    // 3. alcance
    if (offering.scope === 'PROPERTY') {
      if (
        !offering.propertyMember ||
        offering.propertyMember.propertyId !== dto.propertyId
      ) {
        throw new ServiceRequestInvalid(
          'La oferta es exclusiva de otro inmueble',
        );
      }
      if (offering.propertyMember.status !== 'ACTIVE') {
        throw new ServiceOfferingUnavailable(
          'el proveedor ya no es miembro activo del inmueble',
        );
      }
    }

    // 4. el proveedor sale de la oferta (BD), el solicitante del JWT
    if (offering.providerUserId === user.userId) {
      throw new ServiceRequestInvalid('No puedes solicitar tu propia oferta');
    }

    // 5. precio
    let agreedPrice: typeof offering.basePrice | null = null;
    let proposedPrice: string | null = null;
    switch (offering.priceTypeAgreement) {
      case 'FIXED':
        if (dto.proposedPrice) {
          throw new ServiceRequestInvalid(
            'La oferta es de precio fijo: no admite propuestas de precio',
          );
        }
        agreedPrice = offering.basePrice; // tarifa publicada, vigente a hoy
        break;
      case 'CUSTOM_QUOTE':
        if (dto.proposedPrice) {
          throw new ServiceRequestInvalid(
            'El precio se define con la cotizacion del proveedor',
          );
        }
        break;
      default: // NEGOTIABLE, PERCENTAGE: sin base de calculo definida, se pacta explicitamente
        proposedPrice = dto.proposedPrice ?? null;
    }

    const created = await this.prismaClient.$transaction(async (tx) => {
      const request = await this.requestRepository.create(
        {
          serviceOfferingId: offering.id,
          propertyId: dto.propertyId,
          requestedByUserId: user.userId,
          providerUserId: offering.providerUserId,
          status: 'REQUESTED',
          notes: dto.notes ?? null,
          publishedPrice: offering.basePrice,
          agreedPrice,
          priceAgreedAt: agreedPrice ? now : null,
          proposedPrice,
          proposedByUserId: proposedPrice ? user.userId : null,
          currency: offering.currency,
        },
        tx,
      );

      await this.requestRepository.addHistory(
        request.id,
        {
          action: 'CREATED',
          fromStatus: null,
          toStatus: 'REQUESTED',
          actorUserId: user.userId,
        },
        tx,
      );
      if (proposedPrice) {
        await this.requestRepository.addHistory(
          request.id,
          {
            action: 'PRICE_PROPOSED',
            fromStatus: 'REQUESTED',
            toStatus: 'REQUESTED',
            actorUserId: user.userId,
            reason: `Propuesta inicial: ${proposedPrice}`,
          },
          tx,
        );
      }
      return (await this.requestRepository.findById(request.id, tx))!;
    });

    // despues del commit
    await this.notifier.notify(
      user.userId,
      [created.providerUserId],
      'Nueva solicitud de servicio',
      `Tienes una nueva solicitud de ${created.offering.service.name} para ${created.property.propertyName}`,
    );

    return created;
  }

  // ---------------- transiciones ----------------

  async accept(user: AuthUser, id: string, dto: ServiceRequestActionType) {
    const request = await this.getForProvider(user, id, 'accept');
    this.assertFrom(request, ['REQUESTED'], 'accept');

    const updated = await this.applyTransition(request, {
      toStatus: 'ACCEPTED',
      action: 'ACCEPTED',
      actorUserId: user.userId,
      reason: dto.reason,
      data: { acceptedAt: new Date() },
    });
    await this.notifier.notify(
      user.userId,
      [updated.requestedByUserId],
      'Solicitud de servicio aceptada',
      `Tu solicitud de ${updated.offering.service.name} fue aceptada`,
    );
    return updated;
  }

  async reject(user: AuthUser, id: string, dto: ServiceRequestActionType) {
    const request = await this.getForProvider(user, id, 'reject');
    this.assertFrom(request, ['REQUESTED'], 'reject');

    const updated = await this.applyTransition(request, {
      toStatus: 'REJECTED',
      action: 'REJECTED',
      actorUserId: user.userId,
      reason: dto.reason,
      data: {},
    });
    await this.notifier.notify(
      user.userId,
      [updated.requestedByUserId],
      'Solicitud de servicio rechazada',
      `Tu solicitud de ${updated.offering.service.name} fue rechazada${dto.reason ? `: ${dto.reason}` : ''}`,
      'WARNING',
    );
    return updated;
  }

  async start(user: AuthUser, id: string, dto: ServiceRequestActionType) {
    const request = await this.getForProvider(user, id, 'start');
    this.assertFrom(request, ['ACCEPTED'], 'start');
    // no se inicia trabajo sin precio acordado por ambas partes
    if (!request.agreedPrice) throw new ServiceRequestPriceNotAgreed();

    const updated = await this.applyTransition(request, {
      toStatus: 'IN_PROGRESS',
      action: 'STARTED',
      actorUserId: user.userId,
      reason: dto.reason,
      data: { startedAt: new Date() },
    });
    await this.notifier.notify(
      user.userId,
      [updated.requestedByUserId],
      'Trabajo iniciado',
      `El proveedor inicio el servicio ${updated.offering.service.name}`,
    );
    return updated;
  }

  async complete(user: AuthUser, id: string, dto: ServiceRequestActionType) {
    const request = await this.getForProvider(user, id, 'complete');
    this.assertFrom(request, ['IN_PROGRESS'], 'complete');

    const updated = await this.applyTransition(request, {
      toStatus: 'COMPLETED',
      action: 'COMPLETED',
      actorUserId: user.userId,
      reason: dto.reason,
      data: { completedAt: new Date() },
    });
    await this.notifier.notify(
      user.userId,
      [updated.requestedByUserId],
      'Servicio completado',
      `El servicio ${updated.offering.service.name} fue marcado como completado`,
    );
    return updated;
  }

  /**
   * Cancelacion segun actor y estado:
   *  - solicitante (o miembro con CANCELAR_SOLICITUDES_SERVICIOS en el inmueble):
   *    REQUESTED y ACCEPTED (aun no inicio el trabajo).
   *  - proveedor: ACCEPTED e IN_PROGRESS (en REQUESTED debe usar reject).
   * Se exige motivo salvo cuando el solicitante cancela una solicitud aun REQUESTED.
   */
  async cancel(user: AuthUser, id: string, dto: ServiceRequestActionType) {
    const request = await this.requestRepository.findById(id);
    if (!request) throw new ServiceRequestNotFound();

    const isRequester = request.requestedByUserId === user.userId;
    const isProvider = request.providerUserId === user.userId;
    const canCancelAsProperty =
      !isRequester &&
      !isProvider &&
      (await this.systemRole.hasPoliciesInProperty(
        user.userId,
        request.propertyId,
        [POLICIES_STATEMENTS_NAMES.CANCELAR_SOLICITUDES_SERVICIOS],
      ));

    if (!isRequester && !isProvider && !canCancelAsProperty) {
      throw new ServiceRequestActorNotAllowed();
    }

    const allowed = new Set<RequestStatus>();
    if (isRequester || canCancelAsProperty) {
      allowed.add('REQUESTED');
      allowed.add('ACCEPTED');
    }
    if (isProvider) {
      allowed.add('ACCEPTED');
      allowed.add('IN_PROGRESS');
    }
    if (!allowed.has(request.status)) {
      throw new ServiceRequestInvalidTransition(request.status, 'cancel');
    }

    const reasonOptional = isRequester && request.status === 'REQUESTED';
    if (!reasonOptional && !dto.reason) {
      throw new ServiceRequestInvalid(
        'Debes indicar el motivo de la cancelacion',
      );
    }

    const updated = await this.applyTransition(request, {
      toStatus: 'CANCELLED',
      action: 'CANCELLED',
      actorUserId: user.userId,
      reason: dto.reason,
      data: { cancelledAt: new Date() },
    });

    const counterparties = isProvider
      ? [updated.requestedByUserId]
      : isRequester
        ? [updated.providerUserId]
        : [updated.requestedByUserId, updated.providerUserId];
    await this.notifier.notify(
      user.userId,
      counterparties,
      'Solicitud de servicio cancelada',
      `La solicitud de ${updated.offering.service.name} fue cancelada${dto.reason ? `: ${dto.reason}` : ''}`,
      'WARNING',
    );
    return updated;
  }

  // ---------------- negociacion de precio ----------------

  // Propuesta (o contrapropuesta) de precio. Aun NO es un acuerdo: queda en proposedPrice.
  async proposePrice(user: AuthUser, id: string, dto: ProposePriceType) {
    const request = await this.getNegotiable(user, id, 'propose-price');

    if (
      request.offering.priceTypeAgreement === 'CUSTOM_QUOTE' &&
      request.providerUserId !== user.userId
    ) {
      throw new ServiceRequestActorNotAllowed(
        'En una cotizacion personalizada solo el proveedor propone el precio',
      );
    }

    const updated = await this.prismaClient.$transaction(async (tx) => {
      const count = await this.requestRepository.updateIf(
        id,
        { status: request.status, agreedPrice: null },
        { proposedPrice: dto.price, proposedByUserId: user.userId },
        tx,
      );
      if (count === 0) throw new ServiceRequestConcurrentUpdate();

      await this.requestRepository.addHistory(
        id,
        {
          action: 'PRICE_PROPOSED',
          fromStatus: request.status,
          toStatus: request.status,
          actorUserId: user.userId,
          reason: `Precio propuesto: ${dto.price}`,
        },
        tx,
      );
      return (await this.requestRepository.findById(id, tx))!;
    });

    await this.notifier.notify(
      user.userId,
      [this.counterparty(user.userId, updated)],
      'Propuesta de precio',
      `Nueva propuesta de precio (${dto.price} ${updated.currency}) para ${updated.offering.service.name}`,
    );
    return updated;
  }

  // La contraparte acepta la ultima propuesta: recien aqui el precio queda acordado.
  async acceptPrice(user: AuthUser, id: string) {
    const request = await this.getNegotiable(user, id, 'accept-price');

    if (!request.proposedPrice || !request.proposedByUserId) {
      throw new ServiceRequestInvalid('No hay una propuesta de precio vigente');
    }
    if (request.proposedByUserId === user.userId) {
      throw new ServiceRequestActorNotAllowed(
        'No puedes aceptar tu propia propuesta de precio',
      );
    }

    const updated = await this.prismaClient.$transaction(async (tx) => {
      const count = await this.requestRepository.updateIf(
        id,
        {
          status: request.status,
          agreedPrice: null,
          proposedPrice: request.proposedPrice,
          proposedByUserId: request.proposedByUserId,
        },
        { agreedPrice: request.proposedPrice, priceAgreedAt: new Date() },
        tx,
      );
      if (count === 0) throw new ServiceRequestConcurrentUpdate();

      await this.requestRepository.addHistory(
        id,
        {
          action: 'PRICE_AGREED',
          fromStatus: request.status,
          toStatus: request.status,
          actorUserId: user.userId,
          reason: `Precio acordado: ${request.proposedPrice!.toString()}`,
        },
        tx,
      );
      return (await this.requestRepository.findById(id, tx))!;
    });

    await this.notifier.notify(
      user.userId,
      [request.proposedByUserId],
      'Precio acordado',
      `Se acepto el precio de ${updated.offering.service.name}`,
    );
    return updated;
  }

  // ---------------- helpers ----------------

  private isParty(userId: string, request: FullRequest) {
    return (
      request.requestedByUserId === userId || request.providerUserId === userId
    );
  }

  private counterparty(userId: string, request: FullRequest) {
    return request.providerUserId === userId
      ? request.requestedByUserId
      : request.providerUserId;
  }

  private async getForProvider(user: AuthUser, id: string, action: string) {
    const request = await this.requestRepository.findById(id);
    if (!request) throw new ServiceRequestNotFound();
    if (request.providerUserId !== user.userId) {
      throw new ServiceRequestActorNotAllowed(
        `Solo el proveedor asignado puede ejecutar '${action}'`,
      );
    }
    return request;
  }

  // solicitud negociable por una de las partes, antes de iniciar y sin precio acordado
  private async getNegotiable(user: AuthUser, id: string, action: string) {
    const request = await this.requestRepository.findById(id);
    if (!request) throw new ServiceRequestNotFound();
    if (!this.isParty(user.userId, request)) {
      throw new ServiceRequestActorNotAllowed();
    }
    if (request.offering.priceTypeAgreement === 'FIXED') {
      throw new ServiceRequestInvalid(
        'La oferta es de precio fijo: no hay negociacion',
      );
    }
    this.assertFrom(request, ['REQUESTED', 'ACCEPTED'], action);
    if (request.agreedPrice) {
      throw new ServiceRequestInvalid('El precio ya fue acordado');
    }
    return request;
  }

  private assertFrom(
    request: FullRequest,
    allowed: RequestStatus[],
    action: string,
  ) {
    if (!allowed.includes(request.status)) {
      throw new ServiceRequestInvalidTransition(request.status, action);
    }
  }

  // Cambio de estado + historial en una transaccion. El UPDATE se condiciona al estado leido:
  // si otra operacion lo cambio antes (aceptar/cancelar/completar simultaneos) no afecta filas
  // y se responde 409 sin dejar historial huerfano.
  private async applyTransition(
    request: FullRequest,
    t: {
      toStatus: RequestStatus;
      action: HistoryEntry['action'];
      actorUserId: string;
      reason?: string;
      data: Record<string, Date>;
    },
  ) {
    return await this.prismaClient.$transaction(async (tx) => {
      const count = await this.requestRepository.updateIf(
        request.id,
        { status: request.status },
        { status: t.toStatus, ...t.data },
        tx,
      );
      if (count === 0) throw new ServiceRequestConcurrentUpdate();

      await this.requestRepository.addHistory(
        request.id,
        {
          action: t.action,
          fromStatus: request.status,
          toStatus: t.toStatus,
          actorUserId: t.actorUserId,
          reason: t.reason,
        },
        tx,
      );
      return (await this.requestRepository.findById(request.id, tx))!;
    });
  }
}
