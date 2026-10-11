import { PropertyRepository } from './property.repository.js';

const pagination = { page: 1, limit: 10 };

function makePrisma() {
  const prisma: Record<string, any> = {
    property: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    propertyMember: { findFirst: jest.fn() },
    propertyResources: {
      findMany: jest.fn(),
      count: jest.fn(),
      createMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    resourceImages: {
      create: jest.fn(),
      createMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };
  // $transaction acepta array de promesas o callback
  prisma.$transaction.mockImplementation((arg: unknown) =>
    Array.isArray(arg)
      ? Promise.all(arg)
      : (arg as (t: unknown) => unknown)(prisma),
  );
  return prisma;
}

const propertyRow = (extra: Record<string, unknown> = {}) => ({
  id: 'p1',
  fmi: 'f',
  predialNumber: 'pr',
  isPublished: false,
  createAt: new Date(),
  propertyDescription: 'd',
  propertyName: 'n',
  propertyResources: [{ resourcesImage: { id: 'r1' } }],
  typeProperty: { name: 'RESIDENCIAL' },
  propertyOccupationType: { name: 'OCUPADO' },
  economicPropertyInformation: { monthlyRent: 1 },
  propertyStructureDescription: { bedrooms: 1 },
  direction: { id: 'd' },
  ...extra,
});

describe('PropertyRepository', () => {
  let prisma: ReturnType<typeof makePrisma>;
  let repo: PropertyRepository;

  beforeEach(() => {
    prisma = makePrisma();
    repo = new PropertyRepository(prisma as never);
  });

  describe('findAll', () => {
    it('filtra por userId, aplica skip/take y arma la metadata de paginación', async () => {
      prisma.property.findMany.mockResolvedValue([propertyRow()]);
      prisma.property.count.mockResolvedValue(25);

      const res = await repo.findAll('u1', { page: 2, limit: 10 });

      expect(prisma.property.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'u1' },
          skip: 10,
          take: 10,
        }),
      );
      expect(res.metadata).toEqual({
        limit: 10,
        page: 2,
        total: 25,
        totalPages: 3,
        hasNextPage: true,
        hasPreviousPage: true,
      });
      expect(res.data[0]).toMatchObject({
        id: 'p1',
        typeProperty: 'RESIDENCIAL',
        propertyOccupationType: 'OCUPADO',
        resourceImages: [{ id: 'r1' }],
      });
    });

    it('última página: hasNextPage=false', async () => {
      prisma.property.findMany.mockResolvedValue([]);
      prisma.property.count.mockResolvedValue(10);

      const res = await repo.findAll('u1', pagination);

      expect(res.metadata.hasNextPage).toBe(false);
      expect(res.metadata.hasPreviousPage).toBe(false);
    });
  });

  describe('findByFMIOrPredialNumber', () => {
    it('busca por fmi cuando viene fmi', async () => {
      await repo.findByFMIOrPredialNumber('u1', 'FMI', null);
      expect(prisma.property.findFirst).toHaveBeenCalledWith({
        where: { userId: 'u1', fmi: 'FMI' },
      });
    });

    it('busca por predial cuando no hay fmi', async () => {
      await repo.findByFMIOrPredialNumber('u1', null, 'PRE');
      expect(prisma.property.findFirst).toHaveBeenCalledWith({
        where: { userId: 'u1', predialNumber: 'PRE' },
      });
    });

    it('retorna null si no hay ninguno', async () => {
      await expect(
        repo.findByFMIOrPredialNumber('u1', null, null),
      ).resolves.toBeNull();
    });

    // BUG conocido: con fmi presente nunca valida el número predial
    it('detecta duplicado por predial aunque el fmi sea distinto', async () => {
      prisma.property.findFirst
        .mockResolvedValueOnce(null) // por fmi: sin coincidencia
        .mockResolvedValueOnce({ id: 'dup' }); // por predial: duplicado

      await expect(
        repo.findByFMIOrPredialNumber('u1', 'NUEVO', 'PRE'),
      ).resolves.toEqual({
        id: 'dup',
      });
    });
  });

  describe('findPropertyById', () => {
    it('restringe por userId (propietario) e id', async () => {
      prisma.property.findFirst.mockResolvedValue(propertyRow());

      const res = await repo.findPropertyById('u1', 'p1');

      expect(prisma.property.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 'u1', id: 'p1' } }),
      );
      expect(res).toMatchObject({ id: 'p1', typeProperty: 'RESIDENCIAL' });
    });

    it('retorna null si no es del usuario', async () => {
      prisma.property.findFirst.mockResolvedValue(null);
      await expect(repo.findPropertyById('u1', 'p1')).resolves.toBeNull();
    });
  });

  describe('findPropertyByIdAndPropertyMemberId', () => {
    it('consulta por miembro+propiedad y aplana la relación property', async () => {
      prisma.propertyMember.findFirst.mockResolvedValue({
        property: propertyRow(),
      });

      const res = await repo.findPropertyByIdAndPropertyMemberId('m1', 'p1');

      expect(prisma.propertyMember.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'm1', propertyId: 'p1' } }),
      );
      expect(res).toMatchObject({
        id: 'p1',
        propertyOccupationType: 'OCUPADO',
      });
    });

    it('retorna null si el miembro no pertenece a la propiedad', async () => {
      prisma.propertyMember.findFirst.mockResolvedValue(null);
      await expect(
        repo.findPropertyByIdAndPropertyMemberId('m1', 'p1'),
      ).resolves.toBeNull();
    });
  });

  describe('findAllPartialPropertyInfoByPropertyMemberId', () => {
    it('filtra propiedades donde el usuario es miembro con el estado dado', async () => {
      prisma.property.findMany.mockResolvedValue([]);
      prisma.property.count.mockResolvedValue(0);

      await repo.findAllPartialPropertyInfoByPropertyMemberId(
        'u1',
        'ACTIVE',
        pagination,
      );

      expect(prisma.property.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            propertyMembers: { some: { userId: 'u1', status: 'ACTIVE' } },
          },
        }),
      );
    });

    // BUG conocido: el count ignora el status, el total no coincide con la lista filtrada
    it('el total cuenta solo propiedades del estado filtrado', async () => {
      prisma.property.findMany.mockResolvedValue([]);
      prisma.property.count.mockResolvedValue(0);

      await repo.findAllPartialPropertyInfoByPropertyMemberId(
        'u1',
        'ACTIVE',
        pagination,
      );

      expect(prisma.property.count).toHaveBeenCalledWith({
        where: {
          propertyMembers: { some: { userId: 'u1', status: 'ACTIVE' } },
        },
      });
    });
  });

  describe('findPartialPropertyInfoByPropertyMemberId', () => {
    it('limita por membresía del usuario', async () => {
      await repo.findPartialPropertyInfoByPropertyMemberId('u1', 'p1');
      expect(prisma.property.findFirst).toHaveBeenCalledWith({
        where: { id: 'p1', propertyMembers: { some: { userId: 'u1' } } },
        select: { propertyName: true, propertyDescription: true },
      });
    });
  });

  describe('findAllAssetsResourcesByPropertyId', () => {
    it('mapea resourcesImage y calcula metadata', async () => {
      prisma.propertyResources.findMany.mockResolvedValue([
        { resourcesImage: { id: 'r1' } },
      ]);
      prisma.propertyResources.count.mockResolvedValue(1);

      const res = await repo.findAllAssetsResourcesByPropertyId(
        'p1',
        pagination,
      );

      expect(res.data).toEqual([{ id: 'r1' }]);
      expect(res.metadata.total).toBe(1);
    });

    // BUG conocido: `page - 1 * limit` (precedencia) => skip negativo en página 1
    it('página 1 usa skip 0', async () => {
      prisma.propertyResources.findMany.mockResolvedValue([]);
      prisma.propertyResources.count.mockResolvedValue(0);

      await repo.findAllAssetsResourcesByPropertyId('p1', {
        page: 1,
        limit: 100,
      });

      expect(prisma.propertyResources.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 0 }),
      );
    });
  });

  describe('saveProperty', () => {
    const economic = {
      monthlyRent: 1000,
      depositAmount: 500,
      currency: 'COP',
      utilitiesIncluded: true,
    } as never;
    const structure = {
      bedrooms: 3,
      bathrooms: 2,
      floors: 1,
      parkingSpaces: 1,
      area: 80,
      lotArea: 100,
      constructionYear: 2000,
    } as never;

    it('crea propiedad con recursos, info económica y estructura anidadas', async () => {
      await repo.saveProperty(
        { propertyName: 'x' } as never,
        [{ url: 'http://img', assetId: 'a1' }],
        economic,
        structure,
      );

      const { data } = prisma.property.create.mock.calls[0][0];
      expect(data.propertyName).toBe('x');
      expect(
        data.propertyResources.create[0].resourcesImage.create,
      ).toMatchObject({
        url: 'http://img',
        assetId: 'a1',
      });
      expect(data.economicPropertyInformation.create).toMatchObject({
        monthlyRent: 1000,
        currency: 'COP',
      });
      expect(data.propertyStructureDescription.create).toMatchObject({
        area: 80,
        lotArea: 100,
        bathrooms: 2,
      });
    });

    // BUG conocido: bedrooms se llena con bathrooms
    it('bedrooms toma el valor de bedrooms', async () => {
      await repo.saveProperty({} as never, [], economic, structure);

      const { data } = prisma.property.create.mock.calls[0][0];
      expect(data.propertyStructureDescription.create.bedrooms).toBe(3);
    });
  });

  describe('updateResourcesImages', () => {
    it('borra solo los recursos vinculados a la propiedad e inserta los nuevos', async () => {
      prisma.propertyResources.findMany.mockResolvedValue([
        { resourceId: 'r-old' },
      ]);
      prisma.resourceImages.create.mockResolvedValue({ id: 'r-new' });

      await repo.updateResourcesImages('p1', ['a1'], [{ url: 'u' }]);

      expect(prisma.propertyResources.findMany).toHaveBeenCalledWith({
        where: {
          propertyId: 'p1',
          resourcesImage: { assetId: { in: ['a1'] } },
        },
        select: { resourceId: true },
      });
      expect(prisma.propertyResources.deleteMany).toHaveBeenCalledWith({
        where: { propertyId: 'p1', resourceId: { in: ['r-old'] } },
      });
      expect(prisma.resourceImages.deleteMany).toHaveBeenCalledWith({
        where: { id: { in: ['r-old'] } },
      });
      expect(prisma.propertyResources.createMany).toHaveBeenCalledWith({
        data: [{ propertyId: 'p1', resourceId: 'r-new' }],
      });
    });

    it('no ejecuta operaciones vacías', async () => {
      await repo.updateResourcesImages('p1', [], []);
      expect(prisma.propertyResources.findMany).not.toHaveBeenCalled();
      expect(prisma.resourceImages.deleteMany).not.toHaveBeenCalled();
      expect(prisma.propertyResources.createMany).not.toHaveBeenCalled();
    });

    it('dentro de una transacción existente no anida otra', async () => {
      const tx = {
        propertyResources: { findMany: jest.fn().mockResolvedValue([]) },
      };
      await repo.updateResourcesImages('p1', ['a1'], [], tx as never);
      expect(tx.propertyResources.findMany).toHaveBeenCalled();
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });
  });

  describe('saveAssetsResourcesByPropertyId', () => {
    it('crea cada recurso y los enlaza a la propiedad', async () => {
      prisma.resourceImages.create
        .mockResolvedValueOnce({ id: 'r1' })
        .mockResolvedValueOnce({ id: 'r2' });

      await repo.saveAssetsResourcesByPropertyId('p1', [
        { url: 'a' },
        { url: 'b' },
      ]);

      expect(prisma.propertyResources.createMany).toHaveBeenCalledWith({
        data: [
          { propertyId: 'p1', resourceId: 'r1' },
          { propertyId: 'p1', resourceId: 'r2' },
        ],
      });
    });
  });

  it('updateProperty actualiza por id', async () => {
    await repo.updateProperty('p1', { propertyName: 'n' });
    expect(prisma.property.update).toHaveBeenCalledWith({
      where: { id: 'p1' },
      data: { propertyName: 'n' },
    });
  });
});
