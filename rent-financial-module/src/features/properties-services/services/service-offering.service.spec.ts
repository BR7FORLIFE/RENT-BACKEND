import { ServiceOfferingService } from './service-offering.service.js';
import {
  ServiceCatalogInactive,
  ServiceCatalogNotFound,
  ServiceOfferingForbidden,
  ServiceOfferingInvalid,
  ServiceOfferingMemberInvalid,
  ServiceOfferingNotFound,
} from '../exceptions/exceptions.js';
import { PoliciesAuthorizationNotAllowed } from '../../system-property-role/exceptions/exceptions.js';
import { POLICIES_STATEMENTS_NAMES } from '../../../types/global-types.js';

const USER = { userId: 'u1', rols: ['USER'] };
const ADMIN = { userId: 'u-admin', rols: ['ADMIN'] };
const future = new Date(Date.now() + 86_400_000);
const past = new Date(Date.now() - 86_400_000);

const baseDto = {
  serviceId: 's1',
  scope: 'PUBLIC' as const,
  priceTypeAgreement: 'FIXED' as const,
  basePrice: '50000',
  currency: 'COP' as const,
};

describe('ServiceOfferingService', () => {
  const offeringRepository = {
    findAll: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    findPropertyMember: jest.fn(),
  };
  const catalogRepository = { findById: jest.fn() };
  const systemRole = {
    CheckPolicies: jest.fn(),
    verifyPropertyMemberByUserIdInPropertyId: jest.fn(),
  };
  let service: ServiceOfferingService;

  beforeEach(() => {
    jest.resetAllMocks();
    catalogRepository.findById.mockResolvedValue({ id: 's1', isActive: true });
    offeringRepository.create.mockImplementation((d: unknown) =>
      Promise.resolve(d),
    );
    service = new ServiceOfferingService(
      offeringRepository as never,
      catalogRepository as never,
      systemRole as never,
    );
  });

  describe('create', () => {
    it('toma el proveedor del usuario autenticado (no del cliente)', async () => {
      await service.create(USER, {
        ...baseDto,
        providerUserId: 'hacker',
      } as never);
      const data = offeringRepository.create.mock.calls[0][0];
      expect(data.providerUserId).toBe('u1');
      expect(data.propertyMemberId).toBeNull();
      expect(data.scope).toBe('PUBLIC');
    });

    it('404 si el servicio no existe y rechaza servicios inactivos', async () => {
      catalogRepository.findById.mockResolvedValueOnce(null);
      await expect(service.create(USER, baseDto)).rejects.toBeInstanceOf(
        ServiceCatalogNotFound,
      );
      catalogRepository.findById.mockResolvedValueOnce({ isActive: false });
      await expect(service.create(USER, baseDto)).rejects.toBeInstanceOf(
        ServiceCatalogInactive,
      );
      expect(offeringRepository.create).not.toHaveBeenCalled();
    });

    it('rechaza vigencia ya vencida o incoherente', async () => {
      await expect(
        service.create(USER, { ...baseDto, validUntil: past }),
      ).rejects.toBeInstanceOf(ServiceOfferingInvalid);
      await expect(
        service.create(USER, {
          ...baseDto,
          validFrom: new Date(future.getTime() + 1000),
          validUntil: future,
        }),
      ).rejects.toBeInstanceOf(ServiceOfferingInvalid);
    });

    it('PROPERTY: la membresia debe ser del usuario', async () => {
      offeringRepository.findPropertyMember.mockResolvedValue({
        id: 'm1',
        userId: 'otro',
      });
      await expect(
        service.create(USER, {
          ...baseDto,
          scope: 'PROPERTY',
          propertyMemberId: 'm1',
        }),
      ).rejects.toBeInstanceOf(ServiceOfferingMemberInvalid);
    });

    it('PROPERTY: exige la politica PUBLICAR_OFERTAS_SERVICIOS', async () => {
      offeringRepository.findPropertyMember.mockResolvedValue({
        id: 'm1',
        userId: 'u1',
      });
      systemRole.CheckPolicies.mockRejectedValue(
        new PoliciesAuthorizationNotAllowed(),
      );
      await expect(
        service.create(USER, {
          ...baseDto,
          scope: 'PROPERTY',
          propertyMemberId: 'm1',
        }),
      ).rejects.toBeInstanceOf(PoliciesAuthorizationNotAllowed);
      expect(systemRole.CheckPolicies).toHaveBeenCalledWith('m1', [
        POLICIES_STATEMENTS_NAMES.PUBLICAR_OFERTAS_SERVICIOS,
      ]);
      expect(offeringRepository.create).not.toHaveBeenCalled();
    });

    it('PROPERTY: guarda la membresia', async () => {
      offeringRepository.findPropertyMember.mockResolvedValue({
        id: 'm1',
        userId: 'u1',
      });
      await service.create(USER, {
        ...baseDto,
        scope: 'PROPERTY',
        propertyMemberId: 'm1',
      });
      expect(offeringRepository.create.mock.calls[0][0].propertyMemberId).toBe(
        'm1',
      );
    });
  });

  describe('update / changeStatus', () => {
    const current = (over = {}) => ({
      id: 'o1',
      providerUserId: 'u1',
      validFrom: past,
      validUntil: future,
      service: { isActive: true },
      ...over,
    });

    it('solo el proveedor o un administrador modifican', async () => {
      offeringRepository.findById.mockResolvedValue(current());
      await expect(
        service.update({ userId: 'x', rols: [] }, 'o1', { basePrice: '1' }),
      ).rejects.toBeInstanceOf(ServiceOfferingForbidden);
      await service.update(USER, 'o1', { basePrice: '10' });
      await service.update(ADMIN, 'o1', { basePrice: '11' });
      expect(offeringRepository.update).toHaveBeenCalledTimes(2);
    });

    it('404 si no existe', async () => {
      offeringRepository.findById.mockResolvedValue(null);
      await expect(
        service.update(USER, 'o1', { basePrice: '1' }),
      ).rejects.toBeInstanceOf(ServiceOfferingNotFound);
    });

    it('valida coherencia de fechas contra los valores actuales', async () => {
      offeringRepository.findById.mockResolvedValue(current());
      await expect(
        service.update(USER, 'o1', {
          validUntil: new Date(past.getTime() - 1),
        }),
      ).rejects.toBeInstanceOf(ServiceOfferingInvalid);
    });

    it('solo actualiza los campos permitidos', async () => {
      offeringRepository.findById.mockResolvedValue(current());
      await service.update(USER, 'o1', { basePrice: '10', currency: 'USD' });
      expect(offeringRepository.update).toHaveBeenCalledWith('o1', {
        basePrice: '10',
        currency: 'USD',
      });
    });

    it('desactivar solo cambia el status (no borra)', async () => {
      offeringRepository.findById.mockResolvedValue(current());
      await service.changeStatus(USER, 'o1', { status: 'INACTIVE' });
      expect(offeringRepository.update).toHaveBeenCalledWith('o1', {
        status: 'INACTIVE',
      });
    });

    it('no activa ofertas con servicio inactivo o vigencia vencida', async () => {
      offeringRepository.findById.mockResolvedValueOnce(
        current({ service: { isActive: false } }),
      );
      await expect(
        service.changeStatus(USER, 'o1', { status: 'ACTIVE' }),
      ).rejects.toBeInstanceOf(ServiceCatalogInactive);
      offeringRepository.findById.mockResolvedValueOnce(
        current({ validUntil: past }),
      );
      await expect(
        service.changeStatus(USER, 'o1', { status: 'ACTIVE' }),
      ).rejects.toBeInstanceOf(ServiceOfferingInvalid);
    });
  });

  describe('consultas', () => {
    it('findAll / findMine pasan el alcance del usuario', async () => {
      await service.findAll(USER, {} as never);
      await service.findMine(USER, {} as never);
      await service.findAll(ADMIN, {} as never);
      expect(offeringRepository.findAll.mock.calls[0][1]).toEqual({
        userId: 'u1',
        isAdmin: false,
      });
      expect(offeringRepository.findAll.mock.calls[1][1]).toEqual({
        userId: 'u1',
        onlyMine: true,
      });
      expect(offeringRepository.findAll.mock.calls[2][1].isAdmin).toBe(true);
    });

    it('findById: terceros no ven ofertas inactivas, PROPERTY de otros inmuebles', async () => {
      const off = (over = {}) => ({
        providerUserId: 'otro',
        status: 'ACTIVE',
        scope: 'PUBLIC',
        service: { isActive: true },
        propertyMember: null,
        ...over,
      });
      offeringRepository.findById.mockResolvedValue(off());
      await expect(service.findById(USER, 'o')).resolves.toBeDefined();

      offeringRepository.findById.mockResolvedValue(
        off({ status: 'INACTIVE' }),
      );
      await expect(service.findById(USER, 'o')).rejects.toBeInstanceOf(
        ServiceOfferingNotFound,
      );

      offeringRepository.findById.mockResolvedValue(
        off({ scope: 'PROPERTY', propertyMember: { propertyId: 'p9' } }),
      );
      systemRole.verifyPropertyMemberByUserIdInPropertyId.mockRejectedValue(
        new Error('no miembro'),
      );
      await expect(service.findById(USER, 'o')).rejects.toBeInstanceOf(
        ServiceOfferingNotFound,
      );

      systemRole.verifyPropertyMemberByUserIdInPropertyId.mockResolvedValue({});
      await expect(service.findById(USER, 'o')).resolves.toBeDefined();
    });

    it('el proveedor ve sus ofertas inactivas', async () => {
      offeringRepository.findById.mockResolvedValue({
        providerUserId: 'u1',
        status: 'INACTIVE',
      });
      await expect(service.findById(USER, 'o')).resolves.toBeDefined();
    });
  });
});
