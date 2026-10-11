import { PropertyService } from './property.service.js';
import {
  PropertyAlreadyRegisterException,
  PropertyNotFoundException,
} from '../exceptions/exceptions.js';
import { PropertyHelper } from './helpers.service.js';
import { PoliciesAuthorizationNotAllowed } from '../../system-property-role/exceptions/exceptions.js';
import {
  TYPE_LANDORD_ACTOR_ROLES_UUIDS,
  TYPE_PROPERTY_OCCUPATION_TYPE_UUIDS,
  TYPE_PROPERTY_UUIDS,
} from '../../../types/global-types.js';

import { getUserData } from '../api.js';

jest.mock('../api.js', () => ({ getUserData: jest.fn() }));

describe('PropertyService', () => {
  const tx = { __tx: true };
  const prisma = { $transaction: jest.fn() };
  const propertyRepository = {
    findByFMIOrPredialNumber: jest.fn(),
    saveProperty: jest.fn(),
    findAll: jest.fn(),
    findPropertyByIdAndPropertyMemberId: jest.fn(),
    findAssetsResourcesByPropertyId: jest.fn(),
    updateResourcesImages: jest.fn(),
    updateProperty: jest.fn(),
    findAllAssetsResourcesByPropertyId: jest.fn(),
    saveAssetsResourcesByPropertyId: jest.fn(),
    findOwnedPropertyById: jest.fn(),
    findAllPublished: jest.fn(),
    findPublishedById: jest.fn(),
  };
  const propertyMemberRepository = {
    savePropertyMember: jest.fn(),
    savePropertyMemberRole: jest.fn(),
  };
  const mapper = { toDomain: jest.fn() };
  const systemRole = {
    verifyPropertyMemberByUserIdInPropertyId: jest.fn(),
    CheckPolicies: jest.fn(),
  };
  const globalRepository = { saveDirection: jest.fn() };

  let service: PropertyService;
  const member = { id: 'm1', userId: 'u1', propertyId: 'p1', status: 'ACTIVE' };

  beforeEach(() => {
    jest.resetAllMocks();
    prisma.$transaction.mockImplementation((cb: (t: unknown) => unknown) =>
      cb(tx),
    );
    service = new PropertyService(
      prisma as never,
      new PropertyHelper(),
      propertyRepository as never,
      propertyMemberRepository as never,
      mapper,
      systemRole as never,
      globalRepository as never,
    );
    systemRole.verifyPropertyMemberByUserIdInPropertyId.mockResolvedValue(
      member,
    );
    systemRole.CheckPolicies.mockResolvedValue(undefined);
  });

  describe('registerProperty', () => {
    const dto = {
      propertyType: 'RESIDENCIAL',
      propertyOccupationType: 'DESOCUPADO',
      propertyName: 'Casa Azul Centro',
      propertyDescription: 'desc',
      fmi: 'FMI-1',
      predialNumber: 'PRE-1',
      resources: [{ url: 'http://img' }],
      direction: { city: 'Bogotá' },
      economicPropertyInfo: { monthlyRent: 1 },
      structurePropertyInfo: { bedrooms: 1 },
    } as never;

    beforeEach(() => {
      propertyRepository.findByFMIOrPredialNumber.mockResolvedValue(null);
      propertyRepository.saveProperty.mockResolvedValue({ id: 'p-new' });
      propertyMemberRepository.savePropertyMember.mockResolvedValue({
        id: 'm-new',
      });
    });

    it('lanza PropertyAlreadyRegisterException si el fmi/predial ya existe para el usuario', async () => {
      propertyRepository.findByFMIOrPredialNumber.mockResolvedValue({
        id: 'x',
      });

      await expect(service.registerProperty('u1', dto)).rejects.toBeInstanceOf(
        PropertyAlreadyRegisterException,
      );
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('persiste propiedad, dirección, miembro ACTIVE y rol PROPIETARIO en una transacción', async () => {
      const res = await service.registerProperty('u1', dto);

      expect(propertyRepository.saveProperty).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'u1',
          registerByUserId: 'u1',
          isPublished: false,
          propertyTypeId: TYPE_PROPERTY_UUIDS.RESIDENCIAL,
          propertyOccupationTypeId:
            TYPE_PROPERTY_OCCUPATION_TYPE_UUIDS.DESOCUPADO,
        }),
        expect.any(Array),
        expect.anything(),
        expect.anything(),
        tx,
      );
      expect(globalRepository.saveDirection).toHaveBeenCalledWith(
        { city: 'Bogotá', propertyId: 'p-new' },
        tx,
      );
      expect(propertyMemberRepository.savePropertyMember).toHaveBeenCalledWith(
        {
          userId: 'u1',
          assignedBy: 'u1',
          propertyId: 'p-new',
          status: 'ACTIVE',
        },
        tx,
      );
      expect(
        propertyMemberRepository.savePropertyMemberRole,
      ).toHaveBeenCalledWith(
        {
          propertyMemberId: 'm-new',
          propertyActorRoleId: TYPE_LANDORD_ACTOR_ROLES_UUIDS.PROPIETARIO,
        },
        tx,
      );
      expect(res).toEqual({ id: 'p-new', message: expect.any(String) });
    });

    it('propaga errores de la transacción sin devolver éxito', async () => {
      globalRepository.saveDirection.mockRejectedValue(new Error('db down'));
      await expect(service.registerProperty('u1', dto)).rejects.toThrow(
        'db down',
      );
    });
  });

  describe('consultAllProperties', () => {
    it('mapea cada propiedad al dominio y conserva la metadata', async () => {
      propertyRepository.findAll.mockResolvedValue({
        data: [{ id: 'a' }, { id: 'b' }],
        metadata: { total: 2 },
      });
      mapper.toDomain.mockImplementation((p: { id: string }) => ({
        mapped: p.id,
      }));

      const res = await service.consultAllProperties('u1', {
        page: 1,
        limit: 10,
      });

      expect(res).toEqual({
        data: [{ mapped: 'a' }, { mapped: 'b' }],
        metadata: { total: 2 },
      });
    });
  });

  describe('consultPropertyById', () => {
    it('devuelve la propiedad mapeada para un miembro activo', async () => {
      propertyRepository.findPropertyByIdAndPropertyMemberId.mockResolvedValue({
        id: 'p1',
      });
      mapper.toDomain.mockReturnValue({ mapped: true });

      await expect(service.consultPropertyById('u1', 'p1')).resolves.toEqual({
        mapped: true,
      });
      expect(
        propertyRepository.findPropertyByIdAndPropertyMemberId,
      ).toHaveBeenCalledWith('m1', 'p1');
    });

    it('lanza PropertyNotFound si no existe', async () => {
      propertyRepository.findPropertyByIdAndPropertyMemberId.mockResolvedValue(
        null,
      );
      await expect(
        service.consultPropertyById('u1', 'p1'),
      ).rejects.toBeInstanceOf(PropertyNotFoundException);
    });

    it('no consulta nada si el usuario no es miembro', async () => {
      systemRole.verifyPropertyMemberByUserIdInPropertyId.mockRejectedValue(
        new Error('no member'),
      );
      await expect(service.consultPropertyById('u1', 'p1')).rejects.toThrow(
        'no member',
      );
      expect(
        propertyRepository.findPropertyByIdAndPropertyMemberId,
      ).not.toHaveBeenCalled();
    });
  });

  describe('editingProperty', () => {
    beforeEach(() => {
      propertyRepository.findPropertyByIdAndPropertyMemberId.mockResolvedValue({
        id: 'p1',
      });
      propertyRepository.updateProperty.mockResolvedValue({ id: 'p1' });
    });

    it('exige EDITAR_INMUEBLE', async () => {
      await service.editingProperty('u1', 'p1', {
        propertyName: 'Nuevo nombre',
      });
      expect(systemRole.CheckPolicies).toHaveBeenCalledWith('m1', [
        'EDITAR_INMUEBLE',
      ]);
    });

    it('no edita si falta la política', async () => {
      systemRole.CheckPolicies.mockRejectedValue(
        new PoliciesAuthorizationNotAllowed(),
      );

      await expect(
        service.editingProperty('u1', 'p1', { propertyName: 'Nuevo nombre' }),
      ).rejects.toBeInstanceOf(PoliciesAuthorizationNotAllowed);
      expect(propertyRepository.updateProperty).not.toHaveBeenCalled();
    });

    it('lanza PropertyNotFound si la propiedad no existe', async () => {
      propertyRepository.findPropertyByIdAndPropertyMemberId.mockResolvedValue(
        null,
      );
      await expect(
        service.editingProperty('u1', 'p1', { propertyName: 'Nuevo nombre' }),
      ).rejects.toBeInstanceOf(PropertyNotFoundException);
    });

    it('campos simples pasan directo al update', async () => {
      await service.editingProperty('u1', 'p1', {
        propertyName: 'Nuevo nombre',
        propertyDescription: 'otra',
      });

      expect(propertyRepository.updateProperty).toHaveBeenCalledWith('p1', {
        propertyName: 'Nuevo nombre',
        propertyDescription: 'otra',
      });
    });

    it('traduce propertyType y propertyOccupationType a connect por UUID', async () => {
      await service.editingProperty('u1', 'p1', {
        propertyType: 'COMERCIAL',
        propertyOccupationType: 'OCUPADO',
      });

      expect(propertyRepository.updateProperty).toHaveBeenCalledWith('p1', {
        typeProperty: { connect: { id: TYPE_PROPERTY_UUIDS.COMERCIAL } },
        propertyOccupationType: {
          connect: { id: TYPE_PROPERTY_OCCUPATION_TYPE_UUIDS.OCUPADO },
        },
      });
    });

    it('ignora campos undefined', async () => {
      await service.editingProperty('u1', 'p1', {
        propertyName: undefined,
        propertyDescription: 'x',
      });

      expect(propertyRepository.updateProperty).toHaveBeenCalledWith('p1', {
        propertyDescription: 'x',
      });
    });

    it('sincroniza recursos: elimina los ausentes e inserta los nuevos', async () => {
      propertyRepository.findAssetsResourcesByPropertyId.mockResolvedValue([
        { resourcesImage: { assetId: 'keep' } },
        { resourcesImage: { assetId: 'old' } },
      ]);

      await service.editingProperty('u1', 'p1', {
        resources: [
          { assetId: 'keep', url: 'u1' },
          { assetId: 'new', url: 'u2' },
        ],
      });

      const [propertyId, toDelete, toInsert] =
        propertyRepository.updateResourcesImages.mock.calls[0];
      expect(propertyId).toBe('p1');
      expect(toDelete).toEqual(['old']);
      expect(toInsert).toHaveLength(1);
      expect(toInsert[0]).toMatchObject({ assetId: 'new', url: 'u2' });
    });

    // regresión B6: los recursos nuevos no llevan columnas inexistentes
    it('los recursos nuevos no incluyen columnas inexistentes de ResourceImages', async () => {
      propertyRepository.findAssetsResourcesByPropertyId.mockResolvedValue([]);

      await service.editingProperty('u1', 'p1', {
        resources: [{ assetId: 'new', url: 'u2' }],
      });

      const [, , toInsert] =
        propertyRepository.updateResourcesImages.mock.calls[0];
      expect(toInsert[0]).not.toHaveProperty('propertyId');
    });

    // regresión B6: direction es una relación 1:1 y se envía como upsert anidado
    it('direction se transforma en una operación anidada de Prisma', async () => {
      await service.editingProperty('u1', 'p1', {
        direction: { city: 'Cali' } as never,
      });

      const [, data] = propertyRepository.updateProperty.mock.calls[0];
      expect(data.direction).toEqual({
        upsert: { create: { city: 'Cali' }, update: { city: 'Cali' } },
      });
    });
  });

  describe('publicación', () => {
    it('setPublished publica si el JWT es dueño', async () => {
      propertyRepository.findOwnedPropertyById.mockResolvedValue({ id: 'p1' });
      await expect(service.setPublished('u1', 'p1', true)).resolves.toEqual({
        id: 'p1',
        isPublished: true,
      });
      expect(propertyRepository.updateProperty).toHaveBeenCalledWith('p1', {
        isPublished: true,
      });
    });

    it('setPublished rechaza a quien no es dueño', async () => {
      propertyRepository.findOwnedPropertyById.mockResolvedValue(null);
      await expect(service.setPublished('x', 'p1', false)).rejects.toThrow(
        PropertyNotFoundException,
      );
      expect(propertyRepository.updateProperty).not.toHaveBeenCalled();
    });

    it('detalle publicado incluye correo y teléfono del dueño', async () => {
      propertyRepository.findPublishedById.mockResolvedValue({
        id: 'p1',
        ownerUserId: 'owner',
        propertyName: 'Casa',
        typeProperty: 'RESIDENCIAL',
        propertyStructureDescription: { bedrooms: 2 },
      });
      (getUserData as jest.Mock).mockResolvedValue({
        email: 'a@b.co',
        cellphone: '300',
        fullname: 'no expuesto',
      });

      const res = await service.consultPublishedPropertyById('p1');

      expect(getUserData).toHaveBeenCalledWith(null, 'owner');
      expect(res.ownerContact).toEqual({ email: 'a@b.co', cellphone: '300' });
      expect(res).not.toHaveProperty('ownerUserId');
    });

    it('detalle publicado: 404 si no está publicada', async () => {
      propertyRepository.findPublishedById.mockResolvedValue(null);
      await expect(service.consultPublishedPropertyById('p1')).rejects.toThrow(
        PropertyNotFoundException,
      );
      expect(getUserData).not.toHaveBeenCalled();
    });
  });

  describe('documentos', () => {
    it('getAllDocuments exige VER_DOCUMENTOS_INMUEBLE', async () => {
      propertyRepository.findAllAssetsResourcesByPropertyId.mockResolvedValue({
        data: [],
      });

      await service.getAllDocuments('p1', 'u1', { page: 1, limit: 10 });

      expect(systemRole.CheckPolicies).toHaveBeenCalledWith('m1', [
        'VER_DOCUMENTOS_INMUEBLE',
      ]);
      expect(
        propertyRepository.findAllAssetsResourcesByPropertyId,
      ).toHaveBeenCalledWith('p1', {
        page: 1,
        limit: 10,
      });
    });

    it('loadDocuments exige SUBIR_DOCUMENTOS_INMUEBLE y guarda los recursos', async () => {
      const docs = [{ url: 'http://doc' }];

      const res = await service.loadDocuments('p1', 'u1', docs);

      expect(systemRole.CheckPolicies).toHaveBeenCalledWith('m1', [
        'SUBIR_DOCUMENTOS_INMUEBLE',
      ]);
      expect(
        propertyRepository.saveAssetsResourcesByPropertyId,
      ).toHaveBeenCalledWith('p1', docs);
      expect(res).toEqual({ propertyId: 'p1', message: expect.any(String) });
    });

    it('loadDocuments no guarda si falta la política', async () => {
      systemRole.CheckPolicies.mockRejectedValue(
        new PoliciesAuthorizationNotAllowed(),
      );

      await expect(
        service.loadDocuments('p1', 'u1', []),
      ).rejects.toBeInstanceOf(PoliciesAuthorizationNotAllowed);
      expect(
        propertyRepository.saveAssetsResourcesByPropertyId,
      ).not.toHaveBeenCalled();
    });
  });
});
