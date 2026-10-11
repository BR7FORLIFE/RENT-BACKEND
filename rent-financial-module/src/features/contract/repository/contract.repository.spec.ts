import { ContractRepository } from './contract.repository.js';

function makePrisma() {
  const prisma: Record<string, any> = {
    contract: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    contractDraft: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    resourceImages: { create: jest.fn() },
    contractResources: { createMany: jest.fn() },
    $transaction: jest.fn(),
  };
  prisma.$transaction.mockImplementation((arg: unknown[]) => Promise.all(arg));
  return prisma;
}

describe('ContractRepository', () => {
  let prisma: ReturnType<typeof makePrisma>;
  let repo: ContractRepository;

  beforeEach(() => {
    prisma = makePrisma();
    repo = new ContractRepository(prisma as never);
  });

  describe('paginación', () => {
    it('findAllContractByPropertyId aplica skip/take y metadata', async () => {
      prisma.contract.findMany.mockResolvedValue([{ id: 'c1' }]);
      prisma.contract.count.mockResolvedValue(45);

      const res = await repo.findAllContractByPropertyId('p1', {
        page: 3,
        limit: 20,
      });

      expect(prisma.contract.findMany).toHaveBeenCalledWith({
        where: { propertyId: 'p1' },
        skip: 40,
        take: 20,
      });
      expect(res.metadata).toEqual({
        limit: 20,
        page: 3,
        total: 45,
        totalPages: 3,
        hasNextPage: false,
        hasPreviousPage: true,
      });
    });

    it('findAllContractDraftByPropertyId ordena por versión desc', async () => {
      prisma.contractDraft.findMany.mockResolvedValue([]);
      prisma.contractDraft.count.mockResolvedValue(0);

      await repo.findAllContractDraftByPropertyId('p1', { page: 1, limit: 10 });

      expect(prisma.contractDraft.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { version: 'desc' } }),
      );
    });

    it('findAllContractAccepted solo lista borradores aceptados por ambas partes', async () => {
      prisma.contractDraft.findMany.mockResolvedValue([]);
      prisma.contractDraft.count.mockResolvedValue(0);

      await repo.findAllContractAccepted('p1', { page: 1, limit: 10 });

      expect(prisma.contractDraft.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { propertyId: 'p1', landlordAgreed: true, tenantAgreed: true },
        }),
      );
    });

    // BUG conocido: el count no aplica el filtro de aceptación => total/páginas incorrectos
    it('findAllContractAccepted cuenta solo los aceptados', async () => {
      prisma.contractDraft.findMany.mockResolvedValue([]);
      prisma.contractDraft.count.mockResolvedValue(0);

      await repo.findAllContractAccepted('p1', { page: 1, limit: 10 });

      expect(prisma.contractDraft.count).toHaveBeenCalledWith({
        where: { propertyId: 'p1', landlordAgreed: true, tenantAgreed: true },
      });
    });
  });

  describe('finds', () => {
    it('findContractAcceptedById exige aceptación de ambas partes', async () => {
      await repo.findContractAcceptedById('p1', 'd1');
      expect(prisma.contractDraft.findFirst).toHaveBeenCalledWith({
        where: {
          propertyId: 'p1',
          tenantAgreed: true,
          landlordAgreed: true,
          id: 'd1',
        },
      });
    });

    it('findContractDraftByIdAndPropertyId', async () => {
      await repo.findContractDraftByIdAndPropertyId('d1', 'p1');
      expect(prisma.contractDraft.findFirst).toHaveBeenCalledWith({
        where: { id: 'd1', propertyId: 'p1' },
      });
    });

    it('findContractDraftAvailability devuelve el aceptado de mayor versión', async () => {
      await repo.findContractDraftAvailability('p1');
      expect(prisma.contractDraft.findFirst).toHaveBeenCalledWith({
        where: { propertyId: 'p1', tenantAgreed: true, landlordAgreed: true },
        orderBy: { version: 'desc' },
      });
    });

    it('findContractDraftByMemberId LANDLORD filtra por landlordMemberId', async () => {
      await repo.findContractDraftByMemberId('d1', 'p1', 'm1', 'LANDLORD');
      expect(prisma.contractDraft.findFirst).toHaveBeenCalledWith({
        where: { id: 'd1', propertyId: 'p1', landlordMemberId: 'm1' },
      });
    });

    it('findContractDraftByMemberId TENANT filtra por tenantMemberId', async () => {
      await repo.findContractDraftByMemberId('d1', 'p1', 'm1', 'TENANT');
      expect(prisma.contractDraft.findFirst).toHaveBeenCalledWith({
        where: { id: 'd1', propertyId: 'p1', tenantMemberId: 'm1' },
      });
    });

    it('findContractByStatusContractAndPropertyId', async () => {
      await repo.findContractByStatusContractAndPropertyId('ACTIVO', 'p1');
      expect(prisma.contract.findFirst).toHaveBeenCalledWith({
        where: { propertyId: 'p1', status: 'ACTIVO' },
      });
    });

    it('findContractByIdAndPropertyId / findContractByIdAndTenantMemberId', async () => {
      await repo.findContractByIdAndPropertyId('c1', 'p1');
      expect(prisma.contract.findFirst).toHaveBeenLastCalledWith({
        where: { id: 'c1', propertyId: 'p1' },
      });

      await repo.findContractByIdAndTenantMemberId('c1', 'm1');
      expect(prisma.contract.findFirst).toHaveBeenLastCalledWith({
        where: { id: 'c1', tenantMemberId: 'm1' },
      });
    });

    it('findLastVersionInContractDraft devuelve última versión + 1', async () => {
      prisma.contractDraft.findFirst.mockResolvedValue({ version: 4 });
      await expect(repo.findLastVersionInContractDraft('p1')).resolves.toBe(5);
    });

    it('findLastVersionInContractDraft empieza en 1 si no hay borradores', async () => {
      prisma.contractDraft.findFirst.mockResolvedValue(null);
      await expect(repo.findLastVersionInContractDraft('p1')).resolves.toBe(1);
    });
  });

  describe('saves', () => {
    it('saveContract', async () => {
      await repo.saveContract({ propertyId: 'p1' } as never);
      expect(prisma.contract.create).toHaveBeenCalledWith({
        data: { propertyId: 'p1' },
      });
    });

    it('saveContractWithResources crea recursos anidados', async () => {
      await repo.saveContractWithResources({ propertyId: 'p1' } as never, [
        { url: 'http://doc', assetId: 'a1' },
      ]);

      const { data } = prisma.contract.create.mock.calls[0][0];
      expect(
        data.contractResources.create[0].resourcesImage.create,
      ).toMatchObject({
        url: 'http://doc',
        assetId: 'a1',
      });
    });

    it('saveContractDraft', async () => {
      await repo.saveContractDraft({ content: 'x' } as never);
      expect(prisma.contractDraft.create).toHaveBeenCalledWith({
        data: { content: 'x' },
      });
    });

    it('saveContractResourcesByContractId crea recursos y los enlaza al contrato', async () => {
      prisma.resourceImages.create
        .mockResolvedValueOnce({ id: 'r1' })
        .mockResolvedValueOnce({ id: 'r2' });

      await repo.saveContractResourcesByContractId('c1', [
        { url: 'a' },
        { url: 'b' },
      ]);

      expect(prisma.contractResources.createMany).toHaveBeenCalledWith({
        data: [
          { contractId: 'c1', resourceId: 'r1' },
          { contractId: 'c1', resourceId: 'r2' },
        ],
      });
    });
  });

  describe('updates', () => {
    it('updateStatusContractByTenantId filtra por id y tenant', async () => {
      await repo.updateStatusContractByTenantId('c1', 'm1', 'RECHAZADO');
      expect(prisma.contract.update).toHaveBeenCalledWith({
        where: { id: 'c1', tenantMemberId: 'm1' },
        data: { status: 'RECHAZADO' },
      });
    });

    it('updateStatusContractById', async () => {
      await repo.updateStatusContractById('c1', 'ACTIVO');
      expect(prisma.contract.update).toHaveBeenCalledWith({
        where: { id: 'c1' },
        data: { status: 'ACTIVO' },
      });
    });

    it('updateAgreeContractDraft TENANT solo marca tenantAgreed', async () => {
      await repo.updateAgreeContractDraft('d1', 'TENANT');
      expect(prisma.contractDraft.update).toHaveBeenCalledWith({
        where: { id: 'd1' },
        data: { tenantAgreed: true },
      });
    });

    it('updateAgreeContractDraft LANDLORD solo marca landlordAgreed', async () => {
      await repo.updateAgreeContractDraft('d1', 'LANDLORD');
      expect(prisma.contractDraft.update).toHaveBeenCalledWith({
        where: { id: 'd1' },
        data: { landlordAgreed: true },
      });
    });
  });
});
