import { Prisma } from '../../../../../generated/prisma/client.js';
import { PropertyServiceMapper } from './property-mapper.service.js';

const dec = (n: number) => new Prisma.Decimal(n);

function entity(overrides: Record<string, unknown> = {}) {
  return {
    id: 'p1',
    createAt: new Date('2026-01-01T00:00:00Z'),
    fmi: 'FMI',
    predialNumber: 'PRE',
    isPublished: false,
    propertyName: 'Casa Azul',
    propertyDescription: 'desc',
    typeProperty: 'RESIDENCIAL',
    propertyOccupationType: 'OCUPADO',
    direction: {
      id: 'd1',
      propertyId: 'p1',
      latitute: dec(4.5),
      longitud: dec(-74.1),
      department: 'Cundinamarca',
      city: 'Bogotá',
      neighborhood: 'Centro',
      typeStreet: 'CALLE',
      numberStreet: 10,
      complement: null,
      createAt: new Date('2026-01-02T00:00:00Z'),
      updateAt: new Date('2026-01-03T00:00:00Z'),
    },
    economicInfoResponse: {
      monthlyRent: dec(1500000),
      depositAmount: dec(500000),
      currency: 'COP',
      utilitiesIncluded: true,
    },
    structureInfoResponse: {
      bedrooms: 3,
      bathrooms: 2,
      floors: 1,
      parkingSpaces: 1,
      area: dec(80),
      lotArea: dec(120),
      constructionYear: null,
    },
    resourceImages: [
      {
        id: 'r1',
        assetId: 'a1',
        width: 1,
        height: 1,
        format: 'png',
        url: 'http://x',
        secureUrl: null,
        createAt: new Date('2026-01-04T00:00:00Z'),
        updateAt: new Date('2026-01-05T00:00:00Z'),
      },
    ],
    ...overrides,
  };
}

describe('PropertyServiceMapper.toDomain', () => {
  const mapper = new PropertyServiceMapper();

  it('convierte Decimal a number en dirección, economía y estructura', () => {
    const result = mapper.toDomain(entity() as never);

    expect(result.direction).toMatchObject({ latitute: 4.5, longitud: -74.1 });
    expect(result.economicInfoResponse).toMatchObject({
      monthlyRent: 1500000,
      depositAmount: 500000,
    });
    expect(result.structureInfoResponse?.area).toBe(80);
  });

  it('serializa fechas a string y renombra resourceImages -> resources', () => {
    const result = mapper.toDomain(entity() as never);

    expect(typeof result.createAt).toBe('string');
    expect(result.resources).toHaveLength(1);
    expect(typeof result.resources[0].createAt).toBe('string');
    expect(result).not.toHaveProperty('resourceImages');
  });

  it('devuelve null para relaciones opcionales ausentes', () => {
    const result = mapper.toDomain(
      entity({
        direction: null,
        economicInfoResponse: null,
        structureInfoResponse: null,
      }) as never,
    );

    expect(result.direction).toBeNull();
    expect(result.economicInfoResponse).toBeNull();
    expect(result.structureInfoResponse).toBeNull();
  });

  // BUG conocido: el mapper asigna lotArea = area.toNumber()
  it('lotArea refleja el área del lote y no el área construida', () => {
    const result = mapper.toDomain(entity() as never);
    expect(result.structureInfoResponse?.lotArea).toBe(120);
  });
});
