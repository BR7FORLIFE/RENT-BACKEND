import {
  changeServiceStatusDtoRequest,
  createOfferingDtoRequest,
  createServiceRequestDtoRequest,
  listOfferingsQuery,
  serviceRequestActionDtoRequest,
  updateOfferingDtoRequest,
} from './request-dto.js';

const uuid = () => crypto.randomUUID();
const offering = {
  serviceId: uuid(),
  scope: 'PUBLIC',
  priceTypeAgreement: 'FIXED',
  basePrice: 1000,
  currency: 'COP',
};

describe('DTOs del modulo de servicios', () => {
  describe('createOfferingDtoRequest', () => {
    it('acepta una oferta PUBLIC valida y normaliza el importe a string', () => {
      expect(createOfferingDtoRequest.parse(offering).basePrice).toBe('1000');
    });

    it('rechaza providerUserId / status enviados por el cliente (strict)', () => {
      expect(() =>
        createOfferingDtoRequest.parse({ ...offering, providerUserId: uuid() }),
      ).toThrow();
      expect(() =>
        createOfferingDtoRequest.parse({ ...offering, status: 'ACTIVE' }),
      ).toThrow();
    });

    it('PROPERTY exige propertyMemberId y PUBLIC no lo admite', () => {
      expect(() =>
        createOfferingDtoRequest.parse({ ...offering, scope: 'PROPERTY' }),
      ).toThrow();
      expect(() =>
        createOfferingDtoRequest.parse({
          ...offering,
          propertyMemberId: uuid(),
        }),
      ).toThrow();
      expect(() =>
        createOfferingDtoRequest.parse({
          ...offering,
          scope: 'PROPERTY',
          propertyMemberId: uuid(),
        }),
      ).not.toThrow();
    });

    it.each([0, -5, '10.123', 'abc', 12345678901])(
      'rechaza importe %p',
      (v) => {
        expect(() =>
          createOfferingDtoRequest.parse({ ...offering, basePrice: v }),
        ).toThrow();
      },
    );

    it('rechaza moneda desconocida y fechas incoherentes', () => {
      expect(() =>
        createOfferingDtoRequest.parse({ ...offering, currency: 'EUR' }),
      ).toThrow();
      expect(() =>
        createOfferingDtoRequest.parse({
          ...offering,
          validFrom: '2030-02-01',
          validUntil: '2030-01-01',
        }),
      ).toThrow();
    });
  });

  it('updateOfferingDtoRequest: no vacio y sin campos sensibles', () => {
    expect(() => updateOfferingDtoRequest.parse({})).toThrow();
    expect(() => updateOfferingDtoRequest.parse({ scope: 'PUBLIC' })).toThrow();
    expect(updateOfferingDtoRequest.parse({ validUntil: null })).toEqual({
      validUntil: null,
    });
  });

  it('listOfferingsQuery: defaults, lista blanca de orden y rango de precio', () => {
    expect(listOfferingsQuery.parse({})).toMatchObject({
      sortBy: 'createdAt',
      sortOrder: 'desc',
      page: 1,
    });
    expect(() =>
      listOfferingsQuery.parse({ sortBy: 'providerUserId' }),
    ).toThrow();
    expect(() =>
      listOfferingsQuery.parse({ minPrice: '10', maxPrice: '5' }),
    ).toThrow();
    expect(listOfferingsQuery.parse({ onlyValid: 'true' }).onlyValid).toBe(
      true,
    );
  });

  it('createServiceRequestDtoRequest: no acepta status ni solicitante', () => {
    const base = { serviceOfferingId: uuid(), propertyId: uuid() };
    expect(() => createServiceRequestDtoRequest.parse(base)).not.toThrow();
    expect(() =>
      createServiceRequestDtoRequest.parse({ ...base, status: 'ACCEPTED' }),
    ).toThrow();
    expect(() =>
      createServiceRequestDtoRequest.parse({
        ...base,
        requestedByUserId: uuid(),
      }),
    ).toThrow();
  });

  it('acciones: solo reason; estado de catalogo: isActive booleano', () => {
    expect(() =>
      serviceRequestActionDtoRequest.parse({ status: 'COMPLETED' }),
    ).toThrow();
    expect(serviceRequestActionDtoRequest.parse({ reason: ' x ' })).toEqual({
      reason: 'x',
    });
    expect(() =>
      changeServiceStatusDtoRequest.parse({ isActive: 'si' }),
    ).toThrow();
  });
});
