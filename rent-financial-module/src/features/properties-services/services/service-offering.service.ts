import { Injectable } from '@nestjs/common';
import { ServiceOfferingRepository } from '../repository/service-offering.repository.js';
import { ServiceCatalogRepository } from '../repository/service-catalog.repository.js';
import { SystemPropertyService } from '../../system-property-role/services/system-property.service.js';
import {
  POLICIES_STATEMENTS_NAMES,
  type AuthUser,
} from '../../../types/global-types.js';
import type {
  ChangeOfferingStatusType,
  CreateOfferingType,
  ListOfferingsQueryType,
  UpdateOfferingType,
} from '../dtos/request-dto.js';
import {
  ServiceCatalogInactive,
  ServiceCatalogNotFound,
  ServiceOfferingForbidden,
  ServiceOfferingInvalid,
  ServiceOfferingMemberInvalid,
  ServiceOfferingNotFound,
} from '../exceptions/exceptions.js';
import { isServiceAdmin } from '../utils/catalog-admin.js';

/**
 * Alcance de una oferta (definicion del modulo, distinta de PublicService del inmueble):
 *  - PROPERTY: oferta exclusiva del inmueble de `propertyMemberId` (la membresia ACTIVE del
 *    proveedor en ese inmueble). Solo puede solicitarse para ese inmueble.
 *  - PUBLIC: oferta general (sin inmueble asociado); puede solicitarse para cualquier inmueble
 *    sobre el que el solicitante tenga permisos.
 */
@Injectable()
export class ServiceOfferingService {
  constructor(
    private readonly offeringRepository: ServiceOfferingRepository,
    private readonly catalogRepository: ServiceCatalogRepository,
    private readonly systemRole: SystemPropertyService,
  ) {}

  async findAll(user: AuthUser, query: ListOfferingsQueryType) {
    return await this.offeringRepository.findAll(query, {
      userId: user.userId,
      isAdmin: isServiceAdmin(user.rols),
    });
  }

  async findMine(user: AuthUser, query: ListOfferingsQueryType) {
    return await this.offeringRepository.findAll(query, {
      userId: user.userId,
      onlyMine: true,
    });
  }

  async findById(user: AuthUser, id: string) {
    const offering = await this.offeringRepository.findById(id);
    if (!offering) throw new ServiceOfferingNotFound();

    if (offering.providerUserId === user.userId || isServiceAdmin(user.rols)) {
      return offering;
    }

    // terceros: solo ofertas activas y visibles segun su alcance
    const visible =
      offering.status === 'ACTIVE' &&
      offering.service.isActive &&
      (offering.scope === 'PUBLIC' ||
        (!!offering.propertyMember &&
          (await this.isActiveMemberOf(
            user.userId,
            offering.propertyMember.propertyId,
          ))));
    if (!visible) throw new ServiceOfferingNotFound();
    return offering;
  }

  private async isActiveMemberOf(userId: string, propertyId: string) {
    try {
      await this.systemRole.verifyPropertyMemberByUserIdInPropertyId(
        userId,
        propertyId,
      );
      return true;
    } catch {
      return false;
    }
  }

  async create(user: AuthUser, dto: CreateOfferingType) {
    const service = await this.catalogRepository.findById(dto.serviceId);
    if (!service) throw new ServiceCatalogNotFound();
    if (!service.isActive) throw new ServiceCatalogInactive();

    // el proveedor SIEMPRE es el usuario autenticado
    if (dto.scope === 'PROPERTY') {
      const member = await this.offeringRepository.findPropertyMember(
        dto.propertyMemberId!,
      );
      if (!member || member.userId !== user.userId) {
        throw new ServiceOfferingMemberInvalid();
      }
      await this.systemRole.CheckPolicies(member.id, [
        POLICIES_STATEMENTS_NAMES.PUBLICAR_OFERTAS_SERVICIOS,
      ]);
    }

    const validFrom = dto.validFrom ?? new Date();
    if (dto.validUntil && dto.validUntil <= new Date()) {
      throw new ServiceOfferingInvalid(
        'La oferta no puede publicarse con una vigencia ya vencida',
      );
    }
    if (dto.validUntil && dto.validUntil <= validFrom) {
      throw new ServiceOfferingInvalid(
        'validUntil debe ser posterior a validFrom',
      );
    }

    return await this.offeringRepository.create({
      serviceId: dto.serviceId,
      providerUserId: user.userId,
      propertyMemberId: dto.scope === 'PROPERTY' ? dto.propertyMemberId : null,
      scope: dto.scope,
      priceTypeAgreement: dto.priceTypeAgreement,
      basePrice: dto.basePrice,
      currency: dto.currency,
      validFrom,
      validUntil: dto.validUntil ?? null,
    });
  }

  private async getOwnedOffering(user: AuthUser, id: string) {
    const offering = await this.offeringRepository.findById(id);
    if (!offering) throw new ServiceOfferingNotFound();
    if (offering.providerUserId !== user.userId && !isServiceAdmin(user.rols)) {
      throw new ServiceOfferingForbidden();
    }
    return offering;
  }

  // Solo condiciones comerciales hacia adelante: las solicitudes existentes conservan su
  // precio historico (publishedPrice/agreedPrice) y no se alteran.
  async update(user: AuthUser, id: string, dto: UpdateOfferingType) {
    const current = await this.getOwnedOffering(user, id);

    const validFrom = dto.validFrom ?? current.validFrom;
    const validUntil =
      dto.validUntil === undefined ? current.validUntil : dto.validUntil;
    if (validUntil && validUntil <= validFrom) {
      throw new ServiceOfferingInvalid(
        'validUntil debe ser posterior a validFrom',
      );
    }
    if (dto.validUntil && dto.validUntil <= new Date()) {
      throw new ServiceOfferingInvalid(
        'La vigencia de la oferta no puede quedar ya vencida',
      );
    }

    return await this.offeringRepository.update(id, {
      ...(dto.priceTypeAgreement && {
        priceTypeAgreement: dto.priceTypeAgreement,
      }),
      ...(dto.basePrice && { basePrice: dto.basePrice }),
      ...(dto.currency && { currency: dto.currency }),
      ...(dto.validFrom && { validFrom: dto.validFrom }),
      ...(dto.validUntil !== undefined && { validUntil: dto.validUntil }),
    });
  }

  // Desactivar no elimina nada: la oferta y sus solicitudes quedan como historial
  async changeStatus(
    user: AuthUser,
    id: string,
    dto: ChangeOfferingStatusType,
  ) {
    const current = await this.getOwnedOffering(user, id);

    if (dto.status === 'ACTIVE') {
      if (!current.service.isActive) throw new ServiceCatalogInactive();
      if (current.validUntil && current.validUntil <= new Date()) {
        throw new ServiceOfferingInvalid(
          'No se puede activar una oferta con vigencia vencida; actualiza validUntil primero',
        );
      }
    }
    return await this.offeringRepository.update(id, { status: dto.status });
  }
}
