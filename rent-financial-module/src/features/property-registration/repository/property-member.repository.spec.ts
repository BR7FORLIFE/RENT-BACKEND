import { PropertyMemberRepository } from './property-member.repository.js';

function makePrisma() {
  const prisma: Record<string, any> = {
    propertyMember: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    propertyMemberRole: { create: jest.fn(), createMany: jest.fn() },
    $transaction: jest.fn(),
  };
  prisma.$transaction.mockImplementation((arg: unknown[]) => Promise.all(arg));
  return prisma;
}

const memberRow = {
  id: 'm1',
  userId: 'u1',
  status: 'ACTIVE',
  assignedAt: new Date('2026-01-01'),
  propertyId: 'p1',
  propertyMemberPoliciesOverride: [
    { policyStatement: { policyName: 'EDITAR_INMUEBLE' } },
  ],
  propertyMemberRole: [
    {
      propertyActorRole: {
        name: 'PROPIETARIO',
        propertyActorRolePolicyStatements: [
          { policyStatement: { policyName: 'VER_INMUEBLE' } },
          { policyStatement: { policyName: 'EDITAR_INMUEBLE' } },
        ],
      },
    },
  ],
};

describe('PropertyMemberRepository', () => {
  let prisma: ReturnType<typeof makePrisma>;
  let repo: PropertyMemberRepository;

  beforeEach(() => {
    prisma = makePrisma();
    repo = new PropertyMemberRepository(prisma as never);
  });

  it('findAll filtra por propiedad+estado y proyecta roles, políticas y overrides', async () => {
    prisma.propertyMember.findMany.mockResolvedValue([memberRow]);
    prisma.propertyMember.count.mockResolvedValue(1);

    const res = await repo.findAll(prisma as never, 'p1', 'ACTIVE', {
      page: 1,
      limit: 10,
    });

    expect(prisma.propertyMember.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { propertyId: 'p1', status: 'ACTIVE' },
        skip: 0,
        take: 10,
      }),
    );
    expect(res.data[0]).toEqual({
      id: 'm1',
      userId: 'u1',
      status: 'ACTIVE',
      assignedAt: memberRow.assignedAt,
      roles: ['PROPIETARIO'],
      policies: ['VER_INMUEBLE', 'EDITAR_INMUEBLE'],
      overrides: ['EDITAR_INMUEBLE'],
    });
    expect(res.metadata).toMatchObject({
      total: 1,
      totalPages: 1,
      hasNextPage: false,
    });
  });

  it('findPropertyMemberByIdAndPropertyId retorna la misma proyección', async () => {
    prisma.propertyMember.findFirst.mockResolvedValue(memberRow);

    // OJO: la firma es (propertyId, propertyMemberId)
    const res = await repo.findPropertyMemberByIdAndPropertyId('p1', 'm1');

    expect(prisma.propertyMember.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'm1', propertyId: 'p1' } }),
    );
    expect(res).toMatchObject({
      roles: ['PROPIETARIO'],
      overrides: ['EDITAR_INMUEBLE'],
    });
  });

  it('findPropertyMemberByIdAndPropertyId retorna null si no existe', async () => {
    prisma.propertyMember.findFirst.mockResolvedValue(null);
    await expect(
      repo.findPropertyMemberByIdAndPropertyId('p1', 'm1'),
    ).resolves.toBeNull();
  });

  it('findPropertyMemberByUserIdAndPropertyId filtra por ambos', async () => {
    await repo.findPropertyMemberByUserIdAndPropertyId('u1', 'p1');
    expect(prisma.propertyMember.findFirst).toHaveBeenCalledWith({
      where: { userId: 'u1', propertyId: 'p1' },
    });
  });

  it('findPropertyMemberWithRolesByPropertyMemberIdAndPropertyId filtra por id+propiedad', async () => {
    await repo.findPropertyMemberWithRolesByPropertyMemberIdAndPropertyId(
      'm1',
      'p1',
    );
    expect(prisma.propertyMember.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'm1', propertyId: 'p1' } }),
    );
  });

  it('savePropertyMemberWithRoles crea un registro por rol', async () => {
    await repo.savePropertyMemberWithRoles('m1', ['r1', 'r2']);
    expect(prisma.propertyMemberRole.createMany).toHaveBeenCalledWith({
      data: [
        { propertyMemberId: 'm1', propertyActorRoleId: 'r1' },
        { propertyMemberId: 'm1', propertyActorRoleId: 'r2' },
      ],
    });
  });

  it('savePropertyMember / savePropertyMemberRole / updatePropertyMemberStatus delegan en Prisma', async () => {
    await repo.savePropertyMember({ userId: 'u' } as never);
    expect(prisma.propertyMember.create).toHaveBeenCalledWith({
      data: { userId: 'u' },
    });

    await repo.savePropertyMemberRole({ propertyMemberId: 'm' } as never);
    expect(prisma.propertyMemberRole.create).toHaveBeenCalledWith({
      data: { propertyMemberId: 'm' },
    });

    await repo.updatePropertyMemberStatus('m1', 'DESACTIVE');
    expect(prisma.propertyMember.update).toHaveBeenCalledWith({
      where: { id: 'm1' },
      data: { status: 'DESACTIVE' },
    });
  });
});
