import { ServiceRequestService } from './service-request.service.js';
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
import { PoliciesAuthorizationNotAllowed } from '../../system-property-role/exceptions/exceptions.js';
import { POLICIES_STATEMENTS_NAMES } from '../../../types/global-types.js';

const REQUESTER = { userId: 'u-req', rols: ['USER'] };
const PROVIDER = { userId: 'u-prov', rols: ['USER'] };
const OTHER = { userId: 'u-other', rols: ['USER'] };
const PAGINATION = { page: 1, limit: 10 };

const future = new Date(Date.now() + 86_400_000);
const past = new Date(Date.now() - 86_400_000);

const baseOffering = (over: Record<string, unknown> = {}) => ({
  id: 'off1',
  providerUserId: PROVIDER.userId,
  scope: 'PUBLIC',
  status: 'ACTIVE',
  priceTypeAgreement: 'FIXED',
  basePrice: '100000.00',
  currency: 'COP',
  validFrom: past,
  validUntil: future,
  service: { id: 's1', name: 'Plomeria', isActive: true },
  propertyMember: null,
  ...over,
});

const baseRequest = (over: Record<string, unknown> = {}) => ({
  id: 'r1',
  propertyId: 'p1',
  requestedByUserId: REQUESTER.userId,
  providerUserId: PROVIDER.userId,
  status: 'REQUESTED',
  currency: 'COP',
  publishedPrice: '100000.00',
  agreedPrice: '100000.00',
  proposedPrice: null,
  proposedByUserId: null,
  offering: { priceTypeAgreement: 'FIXED', service: { name: 'Plomeria' } },
  property: { propertyName: 'Casa' },
  ...over,
});

describe('ServiceRequestService', () => {
  const tx = { __tx: true };
  const prisma = { $transaction: jest.fn() };
  const requestRepository = {
    findAll: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    updateIf: jest.fn(),
    addHistory: jest.fn(),
  };
  const offeringRepository = { findById: jest.fn() };
  const systemRole = {
    verifyPropertyMemberByUserIdInPropertyId: jest.fn(),
    CheckPolicies: jest.fn(),
    getPropertyIdsWithPolicies: jest.fn(),
    hasPoliciesInProperty: jest.fn(),
  };
  const notifier = { notify: jest.fn() };

  let service: ServiceRequestService;

  beforeEach(() => {
    jest.resetAllMocks();
    prisma.$transaction.mockImplementation((cb: (t: unknown) => unknown) =>
      cb(tx),
    );
    systemRole.verifyPropertyMemberByUserIdInPropertyId.mockResolvedValue({
      id: 'm1',
    });
    requestRepository.updateIf.mockResolvedValue(1);
    notifier.notify.mockResolvedValue(undefined);
    service = new ServiceRequestService(
      prisma as never,
      requestRepository as never,
      offeringRepository as never,
      systemRole as never,
      notifier as never,
    );
  });

  describe('create', () => {
    const dto = { serviceOfferingId: 'off1', propertyId: 'p1' };

    beforeEach(() => {
      requestRepository.create.mockResolvedValue({ id: 'r1' });
      requestRepository.findById.mockResolvedValue(baseRequest());
    });

    it('rechaza sin permiso SOLICITAR_SERVICIOS y no toca la oferta', async () => {
      systemRole.CheckPolicies.mockRejectedValue(
        new PoliciesAuthorizationNotAllowed(),
      );
      await expect(service.create(REQUESTER, dto)).rejects.toBeInstanceOf(
        PoliciesAuthorizationNotAllowed,
      );
      expect(systemRole.CheckPolicies).toHaveBeenCalledWith('m1', [
        POLICIES_STATEMENTS_NAMES.SOLICITAR_SERVICIOS,
      ]);
      expect(offeringRepository.findById).not.toHaveBeenCalled();
      expect(requestRepository.create).not.toHaveBeenCalled();
    });

    it('404 si la oferta no existe', async () => {
      offeringRepository.findById.mockResolvedValue(null);
      await expect(service.create(REQUESTER, dto)).rejects.toBeInstanceOf(
        ServiceOfferingNotFound,
      );
    });

    it.each([
      ['oferta inactiva', { status: 'INACTIVE' }],
      [
        'servicio inactivo',
        { service: { id: 's', name: 'x', isActive: false } },
      ],
      ['vigencia vencida', { validUntil: past }],
      ['vigencia futura', { validFrom: future }],
    ])('rechaza %s', async (_n, over) => {
      offeringRepository.findById.mockResolvedValue(baseOffering(over));
      await expect(service.create(REQUESTER, dto)).rejects.toBeInstanceOf(
        ServiceOfferingUnavailable,
      );
      expect(requestRepository.create).not.toHaveBeenCalled();
    });

    it('oferta PROPERTY de otro inmueble => 406', async () => {
      offeringRepository.findById.mockResolvedValue(
        baseOffering({
          scope: 'PROPERTY',
          propertyMember: { propertyId: 'otra', status: 'ACTIVE' },
        }),
      );
      await expect(service.create(REQUESTER, dto)).rejects.toBeInstanceOf(
        ServiceRequestInvalid,
      );
    });

    it('oferta PROPERTY con proveedor ya no activo => no disponible', async () => {
      offeringRepository.findById.mockResolvedValue(
        baseOffering({
          scope: 'PROPERTY',
          propertyMember: { propertyId: 'p1', status: 'DESACTIVE' },
        }),
      );
      await expect(service.create(REQUESTER, dto)).rejects.toBeInstanceOf(
        ServiceOfferingUnavailable,
      );
    });

    it('no permite solicitar la propia oferta', async () => {
      offeringRepository.findById.mockResolvedValue(baseOffering());
      await expect(service.create(PROVIDER, dto)).rejects.toBeInstanceOf(
        ServiceRequestInvalid,
      );
    });

    it('FIXED: guarda proveedor de la oferta, solicitante del JWT, REQUESTED, precio historico y acordado', async () => {
      offeringRepository.findById.mockResolvedValue(baseOffering());
      await service.create(REQUESTER, dto);

      const data = requestRepository.create.mock.calls[0][0];
      expect(data).toMatchObject({
        serviceOfferingId: 'off1',
        propertyId: 'p1',
        requestedByUserId: 'u-req',
        providerUserId: 'u-prov',
        status: 'REQUESTED',
        publishedPrice: '100000.00',
        agreedPrice: '100000.00',
        proposedPrice: null,
        currency: 'COP',
      });
      expect(data.priceAgreedAt).toBeInstanceOf(Date);
      expect(requestRepository.addHistory).toHaveBeenCalledWith(
        'r1',
        expect.objectContaining({
          action: 'CREATED',
          fromStatus: null,
          toStatus: 'REQUESTED',
          actorUserId: 'u-req',
        }),
        tx,
      );
    });

    it('FIXED no admite proposedPrice', async () => {
      offeringRepository.findById.mockResolvedValue(baseOffering());
      await expect(
        service.create(REQUESTER, { ...dto, proposedPrice: '50' }),
      ).rejects.toBeInstanceOf(ServiceRequestInvalid);
    });

    it('NEGOTIABLE: el precio NO queda acordado; la propuesta se registra', async () => {
      offeringRepository.findById.mockResolvedValue(
        baseOffering({ priceTypeAgreement: 'NEGOTIABLE' }),
      );
      await service.create(REQUESTER, { ...dto, proposedPrice: '80000' });

      const data = requestRepository.create.mock.calls[0][0];
      expect(data.agreedPrice).toBeNull();
      expect(data.priceAgreedAt).toBeNull();
      expect(data.proposedPrice).toBe('80000');
      expect(data.proposedByUserId).toBe('u-req');
      expect(requestRepository.addHistory).toHaveBeenCalledTimes(2);
    });

    it('CUSTOM_QUOTE: el solicitante no puede fijar precio', async () => {
      offeringRepository.findById.mockResolvedValue(
        baseOffering({ priceTypeAgreement: 'CUSTOM_QUOTE' }),
      );
      await expect(
        service.create(REQUESTER, { ...dto, proposedPrice: '1' }),
      ).rejects.toBeInstanceOf(ServiceRequestInvalid);
    });

    it('PERCENTAGE: no inventa un calculo, queda sin precio acordado', async () => {
      offeringRepository.findById.mockResolvedValue(
        baseOffering({ priceTypeAgreement: 'PERCENTAGE' }),
      );
      await service.create(REQUESTER, dto);
      expect(requestRepository.create.mock.calls[0][0].agreedPrice).toBeNull();
    });

    it('notifica al proveedor solo despues de persistir', async () => {
      offeringRepository.findById.mockResolvedValue(baseOffering());
      const order: string[] = [];
      prisma.$transaction.mockImplementation(
        async (cb: (t: unknown) => unknown) => {
          const r = await cb(tx);
          order.push('commit');
          return r;
        },
      );
      notifier.notify.mockImplementation(() => {
        order.push('notify');
        return Promise.resolve();
      });

      await service.create(REQUESTER, dto);
      expect(order).toEqual(['commit', 'notify']);
      expect(notifier.notify.mock.calls[0][1]).toEqual(['u-prov']);
    });

    it('si falla la persistencia no notifica y propaga el error', async () => {
      offeringRepository.findById.mockResolvedValue(baseOffering());
      requestRepository.create.mockRejectedValue(new Error('db down'));
      await expect(service.create(REQUESTER, dto)).rejects.toThrow('db down');
      expect(notifier.notify).not.toHaveBeenCalled();
    });
  });

  describe('transiciones del proveedor', () => {
    it.each([
      ['accept', 'REQUESTED', 'ACCEPTED', 'ACCEPTED'],
      ['reject', 'REQUESTED', 'REJECTED', 'REJECTED'],
      ['start', 'ACCEPTED', 'IN_PROGRESS', 'STARTED'],
      ['complete', 'IN_PROGRESS', 'COMPLETED', 'COMPLETED'],
    ] as const)(
      '%s: %s -> %s, con historial, y notifica al solicitante',
      async (method, from, to, action) => {
        requestRepository.findById.mockResolvedValue(
          baseRequest({ status: from }),
        );
        await service[method](PROVIDER, 'r1', { reason: 'ok' });

        expect(requestRepository.updateIf).toHaveBeenCalledWith(
          'r1',
          { status: from },
          expect.objectContaining({ status: to }),
          tx,
        );
        expect(requestRepository.addHistory).toHaveBeenCalledWith(
          'r1',
          {
            action,
            fromStatus: from,
            toStatus: to,
            actorUserId: 'u-prov',
            reason: 'ok',
          },
          tx,
        );
        expect(notifier.notify.mock.calls[0][1]).toEqual(['u-req']);
      },
    );

    it('fija acceptedAt / startedAt / completedAt', async () => {
      requestRepository.findById.mockResolvedValue(baseRequest());
      await service.accept(PROVIDER, 'r1', {});
      expect(
        requestRepository.updateIf.mock.calls[0][2].acceptedAt,
      ).toBeInstanceOf(Date);

      requestRepository.findById.mockResolvedValue(
        baseRequest({ status: 'ACCEPTED' }),
      );
      await service.start(PROVIDER, 'r1', {});
      expect(
        requestRepository.updateIf.mock.calls[1][2].startedAt,
      ).toBeInstanceOf(Date);

      requestRepository.findById.mockResolvedValue(
        baseRequest({ status: 'IN_PROGRESS' }),
      );
      await service.complete(PROVIDER, 'r1', {});
      expect(
        requestRepository.updateIf.mock.calls[2][2].completedAt,
      ).toBeInstanceOf(Date);
    });

    it.each(['accept', 'reject', 'start', 'complete'] as const)(
      '%s: un usuario que no es el proveedor es rechazado sin modificar',
      async (method) => {
        requestRepository.findById.mockResolvedValue(baseRequest());
        await expect(
          service[method](REQUESTER, 'r1', {}),
        ).rejects.toBeInstanceOf(ServiceRequestActorNotAllowed);
        expect(requestRepository.updateIf).not.toHaveBeenCalled();
        expect(notifier.notify).not.toHaveBeenCalled();
      },
    );

    it.each([
      ['accept', 'ACCEPTED'],
      ['accept', 'COMPLETED'],
      ['reject', 'IN_PROGRESS'],
      ['start', 'REQUESTED'],
      ['complete', 'ACCEPTED'],
      ['complete', 'CANCELLED'],
    ] as const)(
      '%s desde %s es una transicion invalida (409)',
      async (m, st) => {
        requestRepository.findById.mockResolvedValue(
          baseRequest({ status: st }),
        );
        await expect(service[m](PROVIDER, 'r1', {})).rejects.toBeInstanceOf(
          ServiceRequestInvalidTransition,
        );
        expect(requestRepository.updateIf).not.toHaveBeenCalled();
      },
    );

    it('start exige precio acordado', async () => {
      requestRepository.findById.mockResolvedValue(
        baseRequest({ status: 'ACCEPTED', agreedPrice: null }),
      );
      await expect(service.start(PROVIDER, 'r1', {})).rejects.toBeInstanceOf(
        ServiceRequestPriceNotAgreed,
      );
    });

    it('404 si la solicitud no existe', async () => {
      requestRepository.findById.mockResolvedValue(null);
      await expect(service.accept(PROVIDER, 'x', {})).rejects.toBeInstanceOf(
        ServiceRequestNotFound,
      );
    });

    it('concurrencia: si otra operacion gano la carrera responde 409 y no deja historial ni notifica', async () => {
      requestRepository.findById.mockResolvedValue(baseRequest());
      requestRepository.updateIf.mockResolvedValue(0);
      await expect(service.accept(PROVIDER, 'r1', {})).rejects.toBeInstanceOf(
        ServiceRequestConcurrentUpdate,
      );
      expect(requestRepository.addHistory).not.toHaveBeenCalled();
      expect(notifier.notify).not.toHaveBeenCalled();
    });
  });

  describe('cancel', () => {
    beforeEach(() => systemRole.hasPoliciesInProperty.mockResolvedValue(false));

    it('el solicitante cancela REQUESTED sin motivo y se notifica al proveedor', async () => {
      requestRepository.findById.mockResolvedValue(baseRequest());
      await service.cancel(REQUESTER, 'r1', {});
      expect(requestRepository.updateIf.mock.calls[0][2]).toMatchObject({
        status: 'CANCELLED',
      });
      expect(
        requestRepository.updateIf.mock.calls[0][2].cancelledAt,
      ).toBeInstanceOf(Date);
      expect(notifier.notify.mock.calls[0][1]).toEqual(['u-prov']);
    });

    it('el solicitante cancela ACCEPTED solo con motivo', async () => {
      requestRepository.findById.mockResolvedValue(
        baseRequest({ status: 'ACCEPTED' }),
      );
      await expect(service.cancel(REQUESTER, 'r1', {})).rejects.toBeInstanceOf(
        ServiceRequestInvalid,
      );
      await service.cancel(REQUESTER, 'r1', { reason: 'ya no' });
      expect(requestRepository.addHistory).toHaveBeenCalledWith(
        'r1',
        expect.objectContaining({
          action: 'CANCELLED',
          fromStatus: 'ACCEPTED',
          reason: 'ya no',
        }),
        tx,
      );
    });

    it('el solicitante NO puede cancelar un trabajo IN_PROGRESS', async () => {
      requestRepository.findById.mockResolvedValue(
        baseRequest({ status: 'IN_PROGRESS' }),
      );
      await expect(
        service.cancel(REQUESTER, 'r1', { reason: 'x' }),
      ).rejects.toBeInstanceOf(ServiceRequestInvalidTransition);
    });

    it('el proveedor cancela IN_PROGRESS con motivo y notifica al solicitante', async () => {
      requestRepository.findById.mockResolvedValue(
        baseRequest({ status: 'IN_PROGRESS' }),
      );
      await service.cancel(PROVIDER, 'r1', { reason: 'sin material' });
      expect(notifier.notify.mock.calls[0][1]).toEqual(['u-req']);
    });

    it('el proveedor no cancela REQUESTED (debe rechazar)', async () => {
      requestRepository.findById.mockResolvedValue(baseRequest());
      await expect(
        service.cancel(PROVIDER, 'r1', { reason: 'x' }),
      ).rejects.toBeInstanceOf(ServiceRequestInvalidTransition);
    });

    it('un tercero sin politica es rechazado', async () => {
      requestRepository.findById.mockResolvedValue(baseRequest());
      await expect(
        service.cancel(OTHER, 'r1', { reason: 'x' }),
      ).rejects.toBeInstanceOf(ServiceRequestActorNotAllowed);
      expect(systemRole.hasPoliciesInProperty).toHaveBeenCalledWith(
        'u-other',
        'p1',
        [POLICIES_STATEMENTS_NAMES.CANCELAR_SOLICITUDES_SERVICIOS],
      );
    });

    it('un miembro con CANCELAR_SOLICITUDES_SERVICIOS cancela y se notifica a ambas partes', async () => {
      systemRole.hasPoliciesInProperty.mockResolvedValue(true);
      requestRepository.findById.mockResolvedValue(baseRequest());
      await service.cancel(OTHER, 'r1', { reason: 'obra' });
      expect(notifier.notify.mock.calls[0][1]).toEqual(['u-req', 'u-prov']);
    });

    it.each(['COMPLETED', 'CANCELLED', 'REJECTED'])(
      'no se cancela un estado final (%s)',
      async (st) => {
        requestRepository.findById.mockResolvedValue(
          baseRequest({ status: st }),
        );
        await expect(
          service.cancel(PROVIDER, 'r1', { reason: 'x' }),
        ).rejects.toBeInstanceOf(ServiceRequestInvalidTransition);
      },
    );
  });

  describe('negociacion de precio', () => {
    const negotiable = (over: Record<string, unknown> = {}) =>
      baseRequest({
        agreedPrice: null,
        offering: {
          priceTypeAgreement: 'NEGOTIABLE',
          service: { name: 'Plomeria' },
        },
        ...over,
      });

    it('propone precio sin marcarlo como acordado y notifica a la contraparte', async () => {
      requestRepository.findById.mockResolvedValue(negotiable());
      await service.proposePrice(REQUESTER, 'r1', { price: '90000' });

      expect(requestRepository.updateIf).toHaveBeenCalledWith(
        'r1',
        { status: 'REQUESTED', agreedPrice: null },
        { proposedPrice: '90000', proposedByUserId: 'u-req' },
        tx,
      );
      expect(requestRepository.addHistory.mock.calls[0][1].action).toBe(
        'PRICE_PROPOSED',
      );
      expect(notifier.notify.mock.calls[0][1]).toEqual(['u-prov']);
    });

    it('precio FIXED no se negocia', async () => {
      requestRepository.findById.mockResolvedValue(baseRequest());
      await expect(
        service.proposePrice(REQUESTER, 'r1', { price: '1' }),
      ).rejects.toBeInstanceOf(ServiceRequestInvalid);
    });

    it('CUSTOM_QUOTE: solo el proveedor cotiza', async () => {
      requestRepository.findById.mockResolvedValue(
        negotiable({
          offering: {
            priceTypeAgreement: 'CUSTOM_QUOTE',
            service: { name: 'x' },
          },
        }),
      );
      await expect(
        service.proposePrice(REQUESTER, 'r1', { price: '1' }),
      ).rejects.toBeInstanceOf(ServiceRequestActorNotAllowed);
      await service.proposePrice(PROVIDER, 'r1', { price: '1' });
    });

    it('un tercero no negocia', async () => {
      requestRepository.findById.mockResolvedValue(negotiable());
      await expect(
        service.proposePrice(OTHER, 'r1', { price: '1' }),
      ).rejects.toBeInstanceOf(ServiceRequestActorNotAllowed);
    });

    it('no se negocia en IN_PROGRESS ni con precio ya acordado', async () => {
      requestRepository.findById.mockResolvedValue(
        negotiable({ status: 'IN_PROGRESS' }),
      );
      await expect(
        service.proposePrice(REQUESTER, 'r1', { price: '1' }),
      ).rejects.toBeInstanceOf(ServiceRequestInvalidTransition);

      requestRepository.findById.mockResolvedValue(
        negotiable({ agreedPrice: '5' }),
      );
      await expect(
        service.proposePrice(REQUESTER, 'r1', { price: '1' }),
      ).rejects.toBeInstanceOf(ServiceRequestInvalid);
    });

    it('la contraparte acepta: recien ahi se fija agreedPrice y se registra', async () => {
      requestRepository.findById.mockResolvedValue(
        negotiable({ proposedPrice: '90000', proposedByUserId: 'u-req' }),
      );
      await service.acceptPrice(PROVIDER, 'r1');

      expect(requestRepository.updateIf.mock.calls[0][2]).toMatchObject({
        agreedPrice: '90000',
      });
      expect(requestRepository.addHistory.mock.calls[0][1].action).toBe(
        'PRICE_AGREED',
      );
      expect(notifier.notify.mock.calls[0][1]).toEqual(['u-req']);
    });

    it('quien propuso no puede aceptar su propia propuesta', async () => {
      requestRepository.findById.mockResolvedValue(
        negotiable({ proposedPrice: '90000', proposedByUserId: 'u-req' }),
      );
      await expect(service.acceptPrice(REQUESTER, 'r1')).rejects.toBeInstanceOf(
        ServiceRequestActorNotAllowed,
      );
    });

    it('sin propuesta no hay nada que aceptar', async () => {
      requestRepository.findById.mockResolvedValue(negotiable());
      await expect(service.acceptPrice(PROVIDER, 'r1')).rejects.toBeInstanceOf(
        ServiceRequestInvalid,
      );
    });

    it('aceptar precio con carrera perdida => 409', async () => {
      requestRepository.findById.mockResolvedValue(
        negotiable({ proposedPrice: '90000', proposedByUserId: 'u-req' }),
      );
      requestRepository.updateIf.mockResolvedValue(0);
      await expect(service.acceptPrice(PROVIDER, 'r1')).rejects.toBeInstanceOf(
        ServiceRequestConcurrentUpdate,
      );
    });
  });

  describe('consultas y acceso', () => {
    it('findMine / findReceived filtran por el usuario autenticado', async () => {
      await service.findMine(REQUESTER, PAGINATION);
      await service.findReceived(PROVIDER, PAGINATION);
      expect(requestRepository.findAll.mock.calls[0][0]).toEqual({
        requestedByUserId: 'u-req',
      });
      expect(requestRepository.findAll.mock.calls[1][0]).toEqual({
        providerUserId: 'u-prov',
      });
    });

    it('findByProperty exige membresia y VER_SOLICITUDES_SERVICIOS', async () => {
      systemRole.CheckPolicies.mockRejectedValue(
        new PoliciesAuthorizationNotAllowed(),
      );
      await expect(
        service.findByProperty(OTHER, 'p1', PAGINATION),
      ).rejects.toBeInstanceOf(PoliciesAuthorizationNotAllowed);
      expect(requestRepository.findAll).not.toHaveBeenCalled();
    });

    it('findAccessible une propias, recibidas e inmuebles con politica', async () => {
      systemRole.getPropertyIdsWithPolicies.mockResolvedValue(['p1', 'p2']);
      await service.findAccessible(REQUESTER, PAGINATION);
      expect(requestRepository.findAll.mock.calls[0][0]).toEqual({
        OR: [
          { requestedByUserId: 'u-req' },
          { providerUserId: 'u-req' },
          { propertyId: { in: ['p1', 'p2'] } },
        ],
      });
    });

    it('findById: las partes acceden', async () => {
      requestRepository.findById.mockResolvedValue(baseRequest());
      await expect(service.findById(REQUESTER, 'r1')).resolves.toBeDefined();
      await expect(service.findById(PROVIDER, 'r1')).resolves.toBeDefined();
      expect(systemRole.hasPoliciesInProperty).not.toHaveBeenCalled();
    });

    it('findById: un miembro con politica accede', async () => {
      requestRepository.findById.mockResolvedValue(baseRequest());
      systemRole.hasPoliciesInProperty.mockResolvedValue(true);
      await expect(service.findById(OTHER, 'r1')).resolves.toBeDefined();
    });

    it('findById: un tercero recibe 404 (no se revela la solicitud)', async () => {
      requestRepository.findById.mockResolvedValue(baseRequest());
      systemRole.hasPoliciesInProperty.mockResolvedValue(false);
      await expect(service.findById(OTHER, 'r1')).rejects.toBeInstanceOf(
        ServiceRequestNotFound,
      );
    });
  });
});
