import {
  cleanPolicies,
  SystemPropertyService,
} from './system-property.service.js';
import {
  NotAllowedStatusByPropertyMemberException,
  PoliciesAuthorizationNotAllowed,
  PoliciesNotFoundException,
  PropertyActorRoleNotFoundException,
  PropertyMemberNotFound,
  PropertyMemberNotFoundById,
  RolesAuthorizationNotAllowed,
} from '../exceptions/exceptions.js';

describe('cleanPolicies', () => {
  it('elimina duplicados', () => {
    expect(cleanPolicies(['A', 'B', 'A'], [])).toEqual(['A', 'B']);
  });

  it('excluye las políticas desactivadas por override', () => {
    expect(cleanPolicies(['A', 'B', 'C'], ['B'])).toEqual(['A', 'C']);
  });

  it('ignora overrides que el miembro no tenía', () => {
    expect(cleanPolicies(['A'], ['Z'])).toEqual(['A']);
  });

  it('retorna vacío si todas están overrideadas', () => {
    expect(cleanPolicies(['A'], ['A'])).toEqual([]);
  });
});

describe('SystemPropertyService', () => {
  const repo = {
    findAllPoliciesByPropertyMemberId: jest.fn(),
    findOverridePolicyByPropertyMemberId: jest.fn(),
  };
  const prisma = { propertyMember: { findFirst: jest.fn() } };
  let service: SystemPropertyService;

  const activeMember = {
    id: 'm1',
    userId: 'u1',
    propertyId: 'p1',
    status: 'ACTIVE',
  };

  beforeEach(() => {
    jest.resetAllMocks();
    service = new SystemPropertyService(repo as never, prisma as never);
  });

  describe('VerifyPropertyMemberIsActive', () => {
    it('lanza PropertyMemberNotFound si no existe', async () => {
      prisma.propertyMember.findFirst.mockResolvedValue(null);
      await expect(
        service.VerifyPropertyMemberIsActive('m1'),
      ).rejects.toBeInstanceOf(PropertyMemberNotFound);
    });

    it.each(['IN_PROCESS', 'DESACTIVE'])(
      'rechaza estado %s',
      async (status) => {
        prisma.propertyMember.findFirst.mockResolvedValue({
          ...activeMember,
          status,
        });
        await expect(
          service.VerifyPropertyMemberIsActive('m1'),
        ).rejects.toBeInstanceOf(NotAllowedStatusByPropertyMemberException);
      },
    );

    it('acepta miembros ACTIVE', async () => {
      prisma.propertyMember.findFirst.mockResolvedValue(activeMember);
      await expect(
        service.VerifyPropertyMemberIsActive('m1'),
      ).resolves.toBeUndefined();
    });
  });

  describe('CheckPolicies', () => {
    beforeEach(() => {
      prisma.propertyMember.findFirst.mockResolvedValue(activeMember);
    });

    it('permite si alguna política efectiva coincide con las permitidas', async () => {
      repo.findAllPoliciesByPropertyMemberId.mockResolvedValue([
        'VER_CONTRATOS',
        'X',
      ]);
      repo.findOverridePolicyByPropertyMemberId.mockResolvedValue([]);

      await expect(
        service.CheckPolicies('m1', ['VER_CONTRATOS']),
      ).resolves.toBeUndefined();
    });

    it('deniega si la política permitida fue desactivada por override', async () => {
      repo.findAllPoliciesByPropertyMemberId.mockResolvedValue([
        'VER_CONTRATOS',
      ]);
      repo.findOverridePolicyByPropertyMemberId.mockResolvedValue([
        'VER_CONTRATOS',
      ]);

      await expect(
        service.CheckPolicies('m1', ['VER_CONTRATOS']),
      ).rejects.toBeInstanceOf(PoliciesAuthorizationNotAllowed);
    });

    it('la denegación responde 403 FORBIDDEN', async () => {
      repo.findAllPoliciesByPropertyMemberId.mockResolvedValue(['OTRA']);
      repo.findOverridePolicyByPropertyMemberId.mockResolvedValue([]);

      await expect(
        service.CheckPolicies('m1', ['VER_CONTRATOS']),
      ).rejects.toMatchObject({ status: 403, error: 'FORBIDDEN' });
    });

    it('deniega si el miembro no posee ninguna política requerida', async () => {
      repo.findAllPoliciesByPropertyMemberId.mockResolvedValue(['OTRA']);
      repo.findOverridePolicyByPropertyMemberId.mockResolvedValue([]);

      await expect(
        service.CheckPolicies('m1', ['VER_CONTRATOS']),
      ).rejects.toBeInstanceOf(PoliciesAuthorizationNotAllowed);
    });

    it('lanza PoliciesNotFound si el miembro no existe en el repo de políticas', async () => {
      repo.findAllPoliciesByPropertyMemberId.mockResolvedValue(undefined);

      await expect(service.CheckPolicies('m1', ['A'])).rejects.toBeInstanceOf(
        PoliciesNotFoundException,
      );
    });

    it('NOT_ALLOW lanza si el miembro SÍ tiene la política', async () => {
      repo.findAllPoliciesByPropertyMemberId.mockResolvedValue(['A']);
      repo.findOverridePolicyByPropertyMemberId.mockResolvedValue([]);

      await expect(
        service.CheckPolicies('m1', ['A'], 'NOT_ALLOW'),
      ).rejects.toBeInstanceOf(PoliciesAuthorizationNotAllowed);
    });

    it('NOT_ALLOW pasa si el miembro NO tiene la política', async () => {
      repo.findAllPoliciesByPropertyMemberId.mockResolvedValue(['B']);
      repo.findOverridePolicyByPropertyMemberId.mockResolvedValue([]);

      await expect(
        service.CheckPolicies('m1', ['A'], 'NOT_ALLOW'),
      ).resolves.toBeUndefined();
    });

    it('no consulta políticas si el miembro está inactivo', async () => {
      prisma.propertyMember.findFirst.mockResolvedValue({
        ...activeMember,
        status: 'DESACTIVE',
      });

      await expect(service.CheckPolicies('m1', ['A'])).rejects.toBeInstanceOf(
        NotAllowedStatusByPropertyMemberException,
      );
      expect(repo.findAllPoliciesByPropertyMemberId).not.toHaveBeenCalled();
    });
  });

  describe('checkRoles', () => {
    const rolesOf = (...names: string[]) => ({
      propertyMemberRole: names.map((name) => ({
        propertyActorRole: { id: name, name },
      })),
    });

    beforeEach(() => {
      // 1ª llamada: VerifyPropertyMemberIsActive, 2ª: consulta de roles
      prisma.propertyMember.findFirst.mockResolvedValueOnce(activeMember);
    });

    it('permite si tiene alguno de los roles', async () => {
      prisma.propertyMember.findFirst.mockResolvedValueOnce(
        rolesOf('PROPIETARIO'),
      );
      await expect(
        service.checkRoles('m1', ['PROPIETARIO', 'ADMINISTRADOR'], 'msg'),
      ).resolves.toBeUndefined();
    });

    it('lanza RolesAuthorizationNotAllowed con el mensaje dado si no tiene el rol', async () => {
      prisma.propertyMember.findFirst.mockResolvedValueOnce(
        rolesOf('INVITADO'),
      );
      await expect(
        service.checkRoles('m1', ['PROPIETARIO'], 'solo dueños'),
      ).rejects.toMatchObject({
        message: 'solo dueños',
      });
    });

    it('NOT_ALLOW lanza si tiene el rol', async () => {
      prisma.propertyMember.findFirst.mockResolvedValueOnce(
        rolesOf('INVITADO'),
      );
      await expect(
        service.checkRoles('m1', ['INVITADO'], 'no invitados', 'NOT_ALLOW'),
      ).rejects.toBeInstanceOf(RolesAuthorizationNotAllowed);
    });

    it('lanza PropertyActorRoleNotFound si no hay registro de roles', async () => {
      prisma.propertyMember.findFirst.mockResolvedValueOnce(null);
      await expect(service.checkRoles('m1', ['X'], 'm')).rejects.toBeInstanceOf(
        PropertyActorRoleNotFoundException,
      );
    });
  });

  describe('verifyPropertyMemberByUserIdInPropertyId', () => {
    it('retorna el miembro activo y filtra por userId+propertyId', async () => {
      prisma.propertyMember.findFirst.mockResolvedValue(activeMember);

      await expect(
        service.verifyPropertyMemberByUserIdInPropertyId('u1', 'p1'),
      ).resolves.toBe(activeMember);
      expect(prisma.propertyMember.findFirst).toHaveBeenCalledWith({
        where: { userId: 'u1', propertyId: 'p1' },
      });
    });

    it('lanza PropertyMemberNotFound si no pertenece a la propiedad', async () => {
      prisma.propertyMember.findFirst.mockResolvedValue(null);
      await expect(
        service.verifyPropertyMemberByUserIdInPropertyId('u1', 'p1'),
      ).rejects.toBeInstanceOf(PropertyMemberNotFound);
    });

    it('lanza si el miembro no está ACTIVE', async () => {
      prisma.propertyMember.findFirst.mockResolvedValue({
        ...activeMember,
        status: 'IN_PROCESS',
      });
      await expect(
        service.verifyPropertyMemberByUserIdInPropertyId('u1', 'p1'),
      ).rejects.toBeInstanceOf(NotAllowedStatusByPropertyMemberException);
    });
  });

  describe('verifyPropertyMemberByIdAndPropertyId', () => {
    it('retorna el miembro activo', async () => {
      prisma.propertyMember.findFirst.mockResolvedValue(activeMember);
      await expect(
        service.verifyPropertyMemberByIdAndPropertyId('m1', 'p1'),
      ).resolves.toBe(activeMember);
      expect(prisma.propertyMember.findFirst).toHaveBeenCalledWith({
        where: { id: 'm1', propertyId: 'p1' },
      });
    });

    it('lanza PropertyMemberNotFoundById si no existe', async () => {
      prisma.propertyMember.findFirst.mockResolvedValue(null);
      await expect(
        service.verifyPropertyMemberByIdAndPropertyId('m1', 'p1'),
      ).rejects.toBeInstanceOf(PropertyMemberNotFoundById);
    });

    it('lanza si está inactivo', async () => {
      prisma.propertyMember.findFirst.mockResolvedValue({
        ...activeMember,
        status: 'DESACTIVE',
      });
      await expect(
        service.verifyPropertyMemberByIdAndPropertyId('m1', 'p1'),
      ).rejects.toBeInstanceOf(NotAllowedStatusByPropertyMemberException);
    });
  });

  describe('verifyPropertyMemberByIdAndPropertyIdWithoutStatus', () => {
    it('acepta cualquier estado', async () => {
      const m = { ...activeMember, status: 'DESACTIVE' };
      prisma.propertyMember.findFirst.mockResolvedValue(m);
      await expect(
        service.verifyPropertyMemberByIdAndPropertyIdWithoutStatus('m1', 'p1'),
      ).resolves.toBe(m);
    });

    it('lanza si no existe', async () => {
      prisma.propertyMember.findFirst.mockResolvedValue(null);
      await expect(
        service.verifyPropertyMemberByIdAndPropertyIdWithoutStatus('m1', 'p1'),
      ).rejects.toBeInstanceOf(PropertyMemberNotFoundById);
    });
  });
});

describe('SystemPropertyService — politicas por inmueble (consultas)', () => {
  const repo = {
    findAllPoliciesByPropertyMemberId: jest.fn(),
    findOverridePolicyByPropertyMemberId: jest.fn(),
  };
  const prisma = { propertyMember: { findMany: jest.fn() } };
  let service: SystemPropertyService;

  beforeEach(() => {
    jest.resetAllMocks();
    service = new SystemPropertyService(repo as never, prisma as never);
    prisma.propertyMember.findMany.mockResolvedValue([
      { id: 'm1', propertyId: 'p1' },
      { id: 'm2', propertyId: 'p2' },
      { id: 'm3', propertyId: 'p3' },
    ]);
    repo.findAllPoliciesByPropertyMemberId.mockImplementation((id: string) =>
      Promise.resolve(id === 'm3' ? undefined : ['VER', 'OTRA']),
    );
    repo.findOverridePolicyByPropertyMemberId.mockImplementation((id: string) =>
      Promise.resolve(id === 'm2' ? ['VER'] : []),
    );
  });

  it('getPropertyIdsWithPolicies respeta overrides y miembros sin politicas', async () => {
    await expect(
      service.getPropertyIdsWithPolicies('u1', ['VER']),
    ).resolves.toEqual(['p1']);
    expect(prisma.propertyMember.findMany).toHaveBeenCalledWith({
      where: { userId: 'u1', status: 'ACTIVE' },
      select: { id: true, propertyId: true },
    });
  });

  it('hasPoliciesInProperty', async () => {
    await expect(
      service.hasPoliciesInProperty('u1', 'p1', ['VER']),
    ).resolves.toBe(true);
    await expect(
      service.hasPoliciesInProperty('u1', 'p2', ['VER']),
    ).resolves.toBe(false);
  });
});
