import {
  AcceptedOrRejectedContractDtoRequest,
  AgreeContractDraftDtoRequest,
  changeContractStatusDtoRequest,
  createContractDtoRequest,
  generateContractDraftDtoRequest,
  LoadDocumentInContractDtoRequest,
} from './request-dto.js';

const id = () => crypto.randomUUID();

describe('contract request DTOs', () => {
  describe('createContractDtoRequest', () => {
    it('acepta UUIDs válidos', () => {
      const body = {
        propertyId: id(),
        landlordMemberId: id(),
        tenantMemberId: id(),
      };
      expect(createContractDtoRequest.parse(body)).toEqual(body);
    });

    it('rechaza ids que no son UUID', () => {
      expect(() =>
        createContractDtoRequest.parse({
          propertyId: 'x',
          landlordMemberId: id(),
          tenantMemberId: id(),
        }),
      ).toThrow();
    });
  });

  describe('AcceptedOrRejectedContractDtoRequest', () => {
    it.each(['ACCEPTED', 'REJECTED'])('acepta %s', (status) => {
      expect(
        AcceptedOrRejectedContractDtoRequest.parse({
          contractId: id(),
          propertyId: id(),
          status,
        }).status,
      ).toBe(status);
    });

    it('rechaza otros estados', () => {
      expect(() =>
        AcceptedOrRejectedContractDtoRequest.parse({
          contractId: id(),
          propertyId: id(),
          status: 'MAYBE',
        }),
      ).toThrow();
    });
  });

  describe('changeContractStatusDtoRequest', () => {
    it.each(['SUSPENDED', 'FINISHED'])('acepta %s', (status) => {
      expect(changeContractStatusDtoRequest.parse({ status })).toEqual({
        status,
      });
    });

    it('no permite activar un contrato manualmente', () => {
      expect(() =>
        changeContractStatusDtoRequest.parse({ status: 'ACTIVO' }),
      ).toThrow();
    });
  });

  describe('generateContractDraftDtoRequest', () => {
    const base = () => ({
      content: 'texto',
      propertyId: id(),
      landlordMemberId: id(),
      tenantMemberId: id(),
      monthlyRent: '1500000',
      depositAmount: 0,
      startDate: '2026-01-01',
      endDate: '2027-01-01',
    });

    it('coerciona números y fechas', () => {
      const parsed = generateContractDraftDtoRequest.parse(base());
      expect(parsed.monthlyRent).toBe(1500000);
      expect(parsed.startDate).toBeInstanceOf(Date);
      expect(parsed.endDate).toBeInstanceOf(Date);
    });

    it('rechaza montos negativos', () => {
      expect(() =>
        generateContractDraftDtoRequest.parse({ ...base(), monthlyRent: -1 }),
      ).toThrow();
      expect(() =>
        generateContractDraftDtoRequest.parse({ ...base(), depositAmount: -1 }),
      ).toThrow();
    });

    it('rechaza fechas inválidas', () => {
      expect(() =>
        generateContractDraftDtoRequest.parse({ ...base(), startDate: 'nope' }),
      ).toThrow();
    });

    // REGLA DE NEGOCIO FALTANTE: endDate debería ser posterior a startDate
    it('rechaza endDate anterior a startDate', () => {
      expect(() =>
        generateContractDraftDtoRequest.parse({
          ...base(),
          startDate: '2027-01-01',
          endDate: '2026-01-01',
        }),
      ).toThrow();
    });
  });

  it('LoadDocumentInContractDtoRequest exige url en cada recurso', () => {
    expect(() =>
      LoadDocumentInContractDtoRequest.parse({
        propertyId: id(),
        resources: [{}],
      }),
    ).toThrow();
    expect(
      LoadDocumentInContractDtoRequest.parse({
        propertyId: id(),
        resources: [{ url: 'http://x' }],
      }).resources,
    ).toHaveLength(1);
  });

  it('AgreeContractDraftDtoRequest exige propertyId UUID', () => {
    expect(() =>
      AgreeContractDraftDtoRequest.parse({ propertyId: 'x' }),
    ).toThrow();
  });
});
