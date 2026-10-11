import { ServiceRequestRepository } from './service-request.repository.js';
import { ServiceOfferingRepository } from './service-offering.repository.js';

describe('ServiceRequestRepository', () => {
  const prisma = {
    serviceRequest: {
      findMany: jest.fn(),
      count: jest.fn(),
      updateMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    serviceRequestHistory: { create: jest.fn() },
  };
  let repo: ServiceRequestRepository;

  beforeEach(() => {
    jest.resetAllMocks();
    repo = new ServiceRequestRepository(prisma as never);
  });

  it('findAll usa el mismo where en findMany y count, con skip correcto', async () => {
    prisma.serviceRequest.findMany.mockResolvedValue([]);
    prisma.serviceRequest.count.mockResolvedValue(25);
    const res = await repo.findAll(
      { propertyId: 'p' },
      {
        page: 2,
        limit: 10,
        status: 'ACCEPTED',
      },
    );
    const where = { AND: [{ propertyId: 'p' }, { status: 'ACCEPTED' }] };
    expect(prisma.serviceRequest.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where, skip: 10, take: 10 }),
    );
    expect(prisma.serviceRequest.count).toHaveBeenCalledWith({ where });
    expect(res.metadata).toMatchObject({
      total: 25,
      totalPages: 3,
      hasNextPage: true,
      hasPreviousPage: true,
    });
  });

  it('updateIf condiciona el UPDATE y devuelve las filas afectadas', async () => {
    prisma.serviceRequest.updateMany.mockResolvedValue({ count: 0 });
    const count = await repo.updateIf(
      'r1',
      { status: 'REQUESTED' },
      {
        status: 'ACCEPTED',
      },
    );
    expect(count).toBe(0);
    expect(prisma.serviceRequest.updateMany).toHaveBeenCalledWith({
      where: { id: 'r1', status: 'REQUESTED' },
      data: { status: 'ACCEPTED' },
    });
  });

  it('el historial es solo-insercion (el repositorio no expone update/delete)', async () => {
    await repo.addHistory('r1', {
      action: 'CREATED',
      fromStatus: null,
      toStatus: 'REQUESTED',
      actorUserId: 'u',
    });
    expect(prisma.serviceRequestHistory.create).toHaveBeenCalledTimes(1);
    expect(
      Object.keys(Object.getPrototypeOf(repo)).concat(
        Object.getOwnPropertyNames(Object.getPrototypeOf(repo)),
      ),
    ).not.toEqual(expect.arrayContaining(['deleteHistory', 'updateHistory']));
  });

  it('propaga errores de persistencia', async () => {
    prisma.serviceRequest.findMany.mockRejectedValue(new Error('db down'));
    prisma.serviceRequest.count.mockResolvedValue(0);
    await expect(repo.findAll({}, { page: 1, limit: 10 })).rejects.toThrow(
      'db down',
    );
  });
});

describe('ServiceOfferingRepository.findAll', () => {
  const prisma = {
    serviceOffering: { findMany: jest.fn(), count: jest.fn() },
  };
  const repo = new ServiceOfferingRepository(prisma as never);
  const filters = { page: 1, limit: 10, sortBy: 'basePrice', sortOrder: 'asc' };

  beforeEach(() => {
    jest.resetAllMocks();
    prisma.serviceOffering.findMany.mockResolvedValue([]);
    prisma.serviceOffering.count.mockResolvedValue(0);
  });

  it('usuario normal: restringe a propias o activas visibles; count con el mismo where', async () => {
    await repo.findAll(filters as never, { userId: 'u1' });
    const args = prisma.serviceOffering.findMany.mock.calls[0][0];
    const [visibility] = args.where.AND;
    expect(visibility.OR[0]).toEqual({ providerUserId: 'u1' });
    expect(visibility.OR[1]).toMatchObject({
      status: 'ACTIVE',
      service: { isActive: true },
    });
    expect(args.orderBy).toEqual([{ basePrice: 'asc' }, { id: 'asc' }]);
    expect(prisma.serviceOffering.count).toHaveBeenCalledWith({
      where: args.where,
    });
  });

  it('mine: solo del proveedor; admin: sin restriccion de visibilidad', async () => {
    await repo.findAll(filters as never, { userId: 'u1', onlyMine: true });
    expect(prisma.serviceOffering.findMany.mock.calls[0][0].where.AND).toEqual([
      { providerUserId: 'u1' },
    ]);
    await repo.findAll(filters as never, { userId: 'a', isAdmin: true });
    expect(prisma.serviceOffering.findMany.mock.calls[1][0].where.AND).toEqual(
      [],
    );
  });

  it('aplica filtros de precio, moneda y vigencia', async () => {
    await repo.findAll(
      {
        ...filters,
        minPrice: '10',
        maxPrice: '20',
        currency: 'USD',
        onlyValid: true,
      } as never,
      { userId: 'a', isAdmin: true },
    );
    const and = prisma.serviceOffering.findMany.mock.calls[0][0].where.AND;
    expect(and).toEqual(
      expect.arrayContaining([
        { currency: 'USD' },
        { basePrice: { gte: '10' } },
        { basePrice: { lte: '20' } },
        expect.objectContaining({
          status: 'ACTIVE',
          validFrom: expect.anything(),
        }),
      ]),
    );
  });
});
