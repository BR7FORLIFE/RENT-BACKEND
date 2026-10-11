import { FinanceService } from './finance.service.js';
import {
  FinanceContractNotFound,
  FinanceContractPropertyMismatch,
  FinancePropertyNotFound,
  FinancialInvalidData,
  FinancialTransactionConcurrentUpdate,
  FinancialTransactionImmutable,
  FinancialTransactionInvalidTransition,
  FinancialTransactionNotFound,
} from '../exceptions/exceptions.js';
import { PoliciesAuthorizationNotAllowed } from '../../system-property-role/exceptions/exceptions.js';

const USER = { userId: 'u1', rols: [] } as never;
const PROPERTY = 'p1';

describe('FinanceService', () => {
  const systemRole = {
    verifyPropertyMemberByUserIdInPropertyId: jest.fn(),
    CheckPolicies: jest.fn(),
  };
  const repository = {
    findPropertyById: jest.fn(),
    findContractById: jest.fn(),
    create: jest.fn(),
    findByIdAndPropertyId: jest.fn(),
    updateIfStatus: jest.fn(),
    findAllByPropertyId: jest.fn(),
    aggregateSummary: jest.fn(),
  };
  let service: FinanceService;

  beforeEach(() => {
    jest.resetAllMocks();
    systemRole.verifyPropertyMemberByUserIdInPropertyId.mockResolvedValue({
      id: 'm1',
    });
    systemRole.CheckPolicies.mockResolvedValue(undefined);
    repository.findPropertyById.mockResolvedValue({ id: PROPERTY });
    service = new FinanceService(systemRole as never, repository as never);
  });

  const base: Record<string, unknown> = {
    type: 'INCOME',
    category: 'RENT',
    status: 'PENDING',
    description: 'Canon',
    amount: '1000.00',
    currency: 'COP',
    isSimulated: true,
  };
  const createDto = base as never;

  describe('permisos', () => {
    it('rechaza sin politica y no toca la base de datos', async () => {
      systemRole.CheckPolicies.mockRejectedValue(
        new PoliciesAuthorizationNotAllowed(),
      );
      await expect(
        service.create(USER, PROPERTY, createDto),
      ).rejects.toBeInstanceOf(PoliciesAuthorizationNotAllowed);
      expect(repository.create).not.toHaveBeenCalled();
    });

    it.each([
      [
        'create',
        () => service.create(USER, PROPERTY, createDto),
        'REGISTRAR_MOVIMIENTOS_FINANCIEROS',
      ],
      [
        'findById',
        () => service.findById(USER, PROPERTY, 't1'),
        'VER_FINANZAS',
      ],
      [
        'findAll',
        () => service.findAll(USER, PROPERTY, { page: 1, limit: 10 }),
        'VER_FINANZAS',
      ],
      [
        'history',
        () => service.findHistory(USER, PROPERTY, { page: 1, limit: 10 }),
        'VER_FINANZAS',
      ],
      [
        'summary',
        () =>
          service.getSummary(USER, PROPERTY, {
            from: new Date(0),
            to: new Date(),
          }),
        'VER_FINANZAS',
      ],
      [
        'update',
        () => service.update(USER, PROPERTY, 't1', { description: 'x' }),
        'EDITAR_MOVIMIENTOS_FINANCIEROS',
      ],
      [
        'status',
        () => service.changeStatus(USER, PROPERTY, 't1', { status: 'PENDING' }),
        'EDITAR_MOVIMIENTOS_FINANCIEROS',
      ],
      [
        'pay',
        () => service.markAsPaid(USER, PROPERTY, 't1', {}),
        'EDITAR_MOVIMIENTOS_FINANCIEROS',
      ],
    ])('%s exige la politica correspondiente', async (_name, call, policy) => {
      repository.findByIdAndPropertyId.mockResolvedValue(null);
      repository.findAllByPropertyId.mockResolvedValue({});
      repository.aggregateSummary.mockResolvedValue({
        realized: [],
        pending: [],
        overdue: [],
      });
      await call().catch(() => undefined);
      expect(systemRole.CheckPolicies).toHaveBeenCalledWith('m1', [policy]);
    });

    it('un no miembro no accede a datos del inmueble', async () => {
      systemRole.verifyPropertyMemberByUserIdInPropertyId.mockRejectedValue(
        new Error('no member'),
      );
      await expect(service.findById(USER, PROPERTY, 't1')).rejects.toThrow();
      expect(repository.findByIdAndPropertyId).not.toHaveBeenCalled();
    });

    it('lanza 404 si el inmueble no existe', async () => {
      repository.findPropertyById.mockResolvedValue(null);
      await expect(
        service.findAll(USER, PROPERTY, { page: 1, limit: 10 }),
      ).rejects.toBeInstanceOf(FinancePropertyNotFound);
    });

    it('busca la transaccion acotada al inmueble (anti manipulacion de IDs)', async () => {
      repository.findByIdAndPropertyId.mockResolvedValue(null);
      await expect(
        service.findById(USER, PROPERTY, 't-otro'),
      ).rejects.toBeInstanceOf(FinancialTransactionNotFound);
      expect(repository.findByIdAndPropertyId).toHaveBeenCalledWith(
        't-otro',
        PROPERTY,
      );
    });
  });

  describe('create', () => {
    it('valida que el contrato exista', async () => {
      repository.findContractById.mockResolvedValue(null);
      await expect(
        service.create(USER, PROPERTY, { ...base, contractId: 'c1' } as never),
      ).rejects.toBeInstanceOf(FinanceContractNotFound);
    });

    it('valida que el contrato pertenezca al inmueble', async () => {
      repository.findContractById.mockResolvedValue({
        id: 'c1',
        propertyId: 'otro',
      });
      await expect(
        service.create(USER, PROPERTY, { ...base, contractId: 'c1' } as never),
      ).rejects.toBeInstanceOf(FinanceContractPropertyMismatch);
      expect(repository.create).not.toHaveBeenCalled();
    });

    it('crea pendiente sin paidAt', async () => {
      repository.create.mockResolvedValue({ id: 't1' });
      await service.create(USER, PROPERTY, createDto);
      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          propertyId: PROPERTY,
          contractId: null,
          status: 'PENDING',
          paidAt: null,
        }),
      );
    });

    it('registra paidAt al crear un movimiento ya pagado', async () => {
      repository.create.mockResolvedValue({ id: 't1' });
      await service.create(USER, PROPERTY, {
        ...base,
        status: 'PAID',
      } as never);
      const data = repository.create.mock.calls[0][0] as { paidAt: Date };
      expect(data.paidAt).toBeInstanceOf(Date);
    });

    it('rechaza paidAt en el futuro', async () => {
      await expect(
        service.create(USER, PROPERTY, {
          ...base,
          status: 'PAID',
          paidAt: new Date(Date.now() + 86_400_000),
        } as never),
      ).rejects.toBeInstanceOf(FinancialInvalidData);
    });
  });

  describe('estados', () => {
    const existing = (status: string) =>
      repository.findByIdAndPropertyId.mockResolvedValue({ id: 't1', status });

    it('marcar como pagado registra paidAt', async () => {
      existing('PENDING');
      repository.updateIfStatus.mockResolvedValue({ id: 't1', status: 'PAID' });
      await service.markAsPaid(USER, PROPERTY, 't1', {});
      const [, , expected, data] = repository.updateIfStatus.mock.calls[0] as [
        string,
        string,
        string,
        { status: string; paidAt: Date },
      ];
      expect(expected).toBe('PENDING');
      expect(data.status).toBe('PAID');
      expect(data.paidAt).toBeInstanceOf(Date);
    });

    it('paidAt no se envia en estados distintos de PAID', async () => {
      existing('PENDING');
      repository.updateIfStatus.mockResolvedValue({ id: 't1' });
      await service.changeStatus(USER, PROPERTY, 't1', { status: 'OVERDUE' });
      expect(repository.updateIfStatus.mock.calls[0][3]).toEqual({
        status: 'OVERDUE',
      });
    });

    it.each(['PAID', 'CANCELLED'])(
      'un movimiento %s es inmutable (estado y edicion)',
      async (status) => {
        existing(status);
        await expect(
          service.changeStatus(USER, PROPERTY, 't1', { status: 'PENDING' }),
        ).rejects.toBeInstanceOf(FinancialTransactionImmutable);
        await expect(
          service.update(USER, PROPERTY, 't1', { description: 'x' }),
        ).rejects.toBeInstanceOf(FinancialTransactionImmutable);
        expect(repository.updateIfStatus).not.toHaveBeenCalled();
      },
    );

    it('rechaza transiciones invalidas', async () => {
      existing('PLANNED');
      await expect(
        service.changeStatus(USER, PROPERTY, 't1', { status: 'OVERDUE' }),
      ).rejects.toBeInstanceOf(FinancialTransactionInvalidTransition);
    });

    it('detecta actualizaciones concurrentes', async () => {
      existing('PENDING');
      repository.updateIfStatus.mockResolvedValue(null);
      await expect(
        service.markAsPaid(USER, PROPERTY, 't1', {}),
      ).rejects.toBeInstanceOf(FinancialTransactionConcurrentUpdate);
    });
  });

  describe('getSummary', () => {
    const row = (
      type: string,
      currency: string,
      amount: string,
      count = 1,
    ) => ({
      type,
      currency,
      _sum: { amount },
      _count: { _all: count },
    });

    it('calcula el flujo neto por moneda sin mezclar COP y USD', async () => {
      repository.aggregateSummary.mockResolvedValue({
        realized: [
          row('INCOME', 'COP', '1500000.50'),
          row('EXPENSE', 'COP', '200000.25'),
          row('INCOME', 'USD', '100.00'),
        ],
        pending: [
          row('INCOME', 'COP', '300.00'),
          row('EXPENSE', 'USD', '50.10'),
        ],
        overdue: [row('INCOME', 'COP', '300.00', 2)],
      });

      const result = await service.getSummary(USER, PROPERTY, {
        from: new Date('2026-01-01'),
        to: new Date('2026-12-31'),
      });

      expect(result.byCurrency).toEqual([
        {
          currency: 'COP',
          realizedIncome: '1500000.50',
          realizedExpense: '200000.25',
          netCashFlow: '1300000.25',
          pendingIncome: '300.00',
          pendingExpense: '0.00',
          overdue: { count: 2, income: '300.00', expense: '0.00' },
        },
        {
          currency: 'USD',
          realizedIncome: '100.00',
          realizedExpense: '0.00',
          netCashFlow: '100.00',
          pendingIncome: '0.00',
          pendingExpense: '50.10',
          overdue: { count: 0, income: '0.00', expense: '0.00' },
        },
      ]);
    });

    it('el flujo neto puede ser negativo', async () => {
      repository.aggregateSummary.mockResolvedValue({
        realized: [row('EXPENSE', 'COP', '10.05')],
        pending: [],
        overdue: [],
      });
      const result = await service.getSummary(USER, PROPERTY, {
        from: new Date(0),
        to: new Date(),
      });
      expect(result.byCurrency[0].netCashFlow).toBe('-10.05');
    });

    it('sin movimientos devuelve lista vacia', async () => {
      repository.aggregateSummary.mockResolvedValue({
        realized: [],
        pending: [],
        overdue: [],
      });
      const result = await service.getSummary(USER, PROPERTY, {
        from: new Date(0),
        to: new Date(),
      });
      expect(result.byCurrency).toEqual([]);
    });
  });

  describe('listados', () => {
    it('el listado excluye cancelados y el historial no', async () => {
      repository.findAllByPropertyId.mockResolvedValue({});
      const query = { page: 1, limit: 10 };
      await service.findAll(USER, PROPERTY, query);
      await service.findHistory(USER, PROPERTY, query);
      expect(repository.findAllByPropertyId).toHaveBeenNthCalledWith(
        1,
        PROPERTY,
        query,
        true,
      );
      expect(repository.findAllByPropertyId).toHaveBeenNthCalledWith(
        2,
        PROPERTY,
        query,
        false,
      );
    });
  });
});
