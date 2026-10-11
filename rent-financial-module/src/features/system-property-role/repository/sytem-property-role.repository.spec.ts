import { SystemPropertyRoleRepository } from './sytem-property-role.repository.js';

describe('SystemPropertyRoleRepository', () => {
  const prisma = {
    propertyMemberRole: { findMany: jest.fn(), update: jest.fn() },
    propertyActorRolePolicyStatements: { findMany: jest.fn() },
    propertyMemberPoliciesOverride: { findMany: jest.fn() },
    propertyMember: { findUnique: jest.fn() },
  };
  let repo: SystemPropertyRoleRepository;

  beforeEach(() => {
    jest.resetAllMocks();
    repo = new SystemPropertyRoleRepository(prisma as never);
  });

  it('findActorRolesByPropertyMemberId devuelve los nombres de rol', async () => {
    prisma.propertyMemberRole.findMany.mockResolvedValue([
      { propertyActorRole: { name: 'PROPIETARIO' } },
      { propertyActorRole: { name: 'ADMINISTRADOR' } },
    ]);

    await expect(repo.findActorRolesByPropertyMemberId('m1')).resolves.toEqual([
      'PROPIETARIO',
      'ADMINISTRADOR',
    ]);
    expect(prisma.propertyMemberRole.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { propertyMemberId: 'm1' } }),
    );
  });

  it('findPoliciesByActorRoleId devuelve los nombres de política', async () => {
    prisma.propertyActorRolePolicyStatements.findMany.mockResolvedValue([
      { policyStatement: { policyName: 'VER_INMUEBLE' } },
    ]);

    await expect(repo.findPoliciesByActorRoleId('r1')).resolves.toEqual([
      'VER_INMUEBLE',
    ]);
  });

  it('findOverridePolicyByPropertyMemberId solo consulta overrides inactivos', async () => {
    prisma.propertyMemberPoliciesOverride.findMany.mockResolvedValue([
      { policyStatement: { policyName: 'EDITAR_INMUEBLE' } },
    ]);

    await expect(
      repo.findOverridePolicyByPropertyMemberId('m1'),
    ).resolves.toEqual(['EDITAR_INMUEBLE']);
    expect(prisma.propertyMemberPoliciesOverride.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { propertyMemberId: 'm1', active: false },
      }),
    );
  });

  it('findAllPoliciesByPropertyMemberId aplana las políticas de todos los roles', async () => {
    prisma.propertyMember.findUnique.mockResolvedValue({
      propertyMemberRole: [
        {
          propertyActorRole: {
            propertyActorRolePolicyStatements: [
              { policyStatement: { policyName: 'A' } },
              { policyStatement: { policyName: 'B' } },
            ],
          },
        },
        {
          propertyActorRole: {
            propertyActorRolePolicyStatements: [
              { policyStatement: { policyName: 'C' } },
            ],
          },
        },
      ],
    });

    await expect(repo.findAllPoliciesByPropertyMemberId('m1')).resolves.toEqual(
      ['A', 'B', 'C'],
    );
  });

  it('findAllPoliciesByPropertyMemberId devuelve undefined si el miembro no existe', async () => {
    prisma.propertyMember.findUnique.mockResolvedValue(null);
    await expect(
      repo.findAllPoliciesByPropertyMemberId('x'),
    ).resolves.toBeUndefined();
  });

  it('usa el cliente transaccional cuando se le pasa', async () => {
    const tx = {
      propertyMemberRole: { findMany: jest.fn().mockResolvedValue([]) },
    };
    await repo.findActorRolesByPropertyMemberId('m1', tx as never);
    expect(tx.propertyMemberRole.findMany).toHaveBeenCalled();
    expect(prisma.propertyMemberRole.findMany).not.toHaveBeenCalled();
  });

  it('updatePropertyActorRole usa la llave compuesta (rol, miembro)', async () => {
    await repo.updatePropertyActorRole('m1', 'old', 'new');

    expect(prisma.propertyMemberRole.update).toHaveBeenCalledWith({
      where: {
        propertyActorRoleId_propertyMemberId: {
          propertyMemberId: 'm1',
          propertyActorRoleId: 'old',
        },
      },
      data: { propertyActorRoleId: 'new' },
    });
  });
});
