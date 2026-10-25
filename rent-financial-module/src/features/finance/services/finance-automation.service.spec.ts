import { FinanceAutomationService } from './finance-automation.service.js';

describe('FinanceAutomationService', () => {
  const prisma = {
    contract: { findMany: jest.fn() },
    financialTransaction: {
      findFirst: jest.fn(),
      create: jest.fn(),
      updateMany: jest.fn(),
    },
  };
  let service: FinanceAutomationService;

  beforeEach(() => {
    jest.resetAllMocks();
    service = new FinanceAutomationService(prisma as never);
  });

  describe('registerServiceExpense', () => {
    const source = {
      id: 'sr1',
      propertyId: 'p1',
      agreedPrice: '150000',
      currency: 'COP' as const,
      serviceName: 'Plomeria',
    };

    it('crea el gasto pendiente del servicio', async () => {
      prisma.financialTransaction.findFirst.mockResolvedValue(null);
      await service.registerServiceExpense(source);
      expect(prisma.financialTransaction.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          propertyId: 'p1',
          type: 'EXPENSE',
          category: 'SERVICE',
          status: 'PENDING',
          amount: '150000',
        }),
      });
    });

    it('es idempotente si el gasto ya existe', async () => {
      prisma.financialTransaction.findFirst.mockResolvedValue({ id: 't1' });
      await service.registerServiceExpense(source);
      expect(prisma.financialTransaction.create).not.toHaveBeenCalled();
    });
  });

  describe('generateDueRent', () => {
    const contract = {
      id: 'c1',
      propertyId: 'p1',
      monthlyRent: { toString: () => '1000000' },
      startDate: new Date('2026-01-31T00:00:00Z'),
      endDate: new Date('2026-12-31T00:00:00Z'),
    };

    it('crea un ingreso por cada fecha de pago vencida (ajustando fin de mes)', async () => {
      prisma.contract.findMany.mockResolvedValue([contract]);
      prisma.financialTransaction.findFirst.mockResolvedValue(null);

      const created = await service.generateDueRent(
        undefined,
        new Date('2026-03-15T00:00:00Z'),
      );

      // 31 ene y 28 feb; el 31 mar aun no llega
      expect(created).toBe(2);
      const dues = prisma.financialTransaction.create.mock.calls.map(
        ([arg]) => (arg.data.dueDate as Date).toISOString().slice(0, 10),
      );
      expect(dues).toEqual(['2026-01-31', '2026-02-28']);
      expect(prisma.financialTransaction.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: 'INCOME',
          category: 'RENT',
          status: 'PAID',
          isSimulated: true,
          contractId: 'c1',
        }),
      });
    });

    it('no duplica ingresos ya registrados', async () => {
      prisma.contract.findMany.mockResolvedValue([contract]);
      prisma.financialTransaction.findFirst.mockResolvedValue({ id: 't' });

      const created = await service.generateDueRent(
        undefined,
        new Date('2026-03-15T00:00:00Z'),
      );
      expect(created).toBe(0);
    });
  });
});
