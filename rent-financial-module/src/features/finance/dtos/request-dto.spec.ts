import {
  changeFinancialStatusDtoRequest,
  createFinancialTransactionDtoRequest,
  financialSummaryQuery,
  listFinancialTransactionsQuery,
  updateFinancialTransactionDtoRequest,
} from './request-dto.js';

const valid = {
  type: 'INCOME',
  category: 'RENT',
  description: 'Canon',
  amount: 1000,
  currency: 'COP',
};

describe('finance DTOs', () => {
  it('aplica defaults en la creacion', () => {
    const dto = createFinancialTransactionDtoRequest.parse(valid);
    expect(dto.status).toBe('PENDING');
    expect(dto.isSimulated).toBe(true);
    expect(dto.amount).toBe('1000');
  });

  it.each([0, -5, '0', '1.234', 'abc', 99999999999])(
    'rechaza importe invalido %j',
    (amount) => {
      expect(() =>
        createFinancialTransactionDtoRequest.parse({ ...valid, amount }),
      ).toThrow();
    },
  );

  it('rechaza moneda, tipo y campos desconocidos', () => {
    expect(() =>
      createFinancialTransactionDtoRequest.parse({ ...valid, currency: 'EUR' }),
    ).toThrow();
    expect(() =>
      createFinancialTransactionDtoRequest.parse({ ...valid, type: 'X' }),
    ).toThrow();
    expect(() =>
      createFinancialTransactionDtoRequest.parse({ ...valid, propertyId: 'x' }),
    ).toThrow();
  });

  it('no permite crear cancelados ni paidAt sin PAID', () => {
    expect(() =>
      createFinancialTransactionDtoRequest.parse({
        ...valid,
        status: 'CANCELLED',
      }),
    ).toThrow();
    expect(() =>
      createFinancialTransactionDtoRequest.parse({
        ...valid,
        paidAt: '2026-01-01',
      }),
    ).toThrow();
  });

  it('la actualizacion exige algun campo y no permite cambiar tipo ni estado', () => {
    expect(() => updateFinancialTransactionDtoRequest.parse({})).toThrow();
    expect(() =>
      updateFinancialTransactionDtoRequest.parse({ status: 'PAID' }),
    ).toThrow();
    expect(() =>
      updateFinancialTransactionDtoRequest.parse({ type: 'EXPENSE' }),
    ).toThrow();
  });

  it('paidAt solo con estado PAID', () => {
    expect(() =>
      changeFinancialStatusDtoRequest.parse({
        status: 'PENDING',
        paidAt: '2026-01-01',
      }),
    ).toThrow();
    expect(
      changeFinancialStatusDtoRequest.parse({ status: 'PAID' }).status,
    ).toBe('PAID');
  });

  it('valida rangos de fechas y filtros', () => {
    expect(() =>
      listFinancialTransactionsQuery.parse({
        from: '2026-12-01',
        to: '2026-01-01',
      }),
    ).toThrow();
    expect(() =>
      listFinancialTransactionsQuery.parse({ from: 'no-fecha' }),
    ).toThrow();
    expect(() =>
      listFinancialTransactionsQuery.parse({ status: 'NOPE' }),
    ).toThrow();
    expect(
      listFinancialTransactionsQuery.parse({ type: 'EXPENSE' }).limit,
    ).toBe(100);
  });

  it('el resumen exige from y to ordenados', () => {
    expect(() => financialSummaryQuery.parse({ from: '2026-01-01' })).toThrow();
    expect(() =>
      financialSummaryQuery.parse({ from: '2026-02-01', to: '2026-01-01' }),
    ).toThrow();
    expect(
      financialSummaryQuery.parse({ from: '2026-01-01', to: '2026-02-01' }).to,
    ).toBeInstanceOf(Date);
  });
});
