import { Injectable } from '@nestjs/common';
import type {
  Currency,
  FinancialRecordStatus,
  FinancialTransactionType,
} from '../../../../generated/prisma/enums.js';
import { SystemPropertyService } from '../../system-property-role/services/system-property.service.js';
import { FinanceRepository } from '../repository/finance.repository.js';
import {
  POLICIES_STATEMENTS_NAMES,
  type AuthUser,
} from '../../../types/global-types.js';
import type {
  ChangeFinancialStatusType,
  CreateFinancialTransactionType,
  FinancialSummaryQueryType,
  ListFinancialTransactionsQueryType,
  MarkAsPaidType,
  UpdateFinancialTransactionType,
} from '../dtos/request-dto.js';
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

type RecordStatus = FinancialRecordStatus;
type TransactionType = FinancialTransactionType;

interface GroupRow {
  type: TransactionType;
  currency: Currency;
  _sum: { amount: { toString(): string } | null };
  _count: { _all: number };
}

const ALLOWED_TRANSITIONS: Record<RecordStatus, RecordStatus[]> = {
  PLANNED: ['PENDING', 'PAID', 'CANCELLED'],
  PENDING: ['PLANNED', 'PAID', 'OVERDUE', 'CANCELLED'],
  OVERDUE: ['PENDING', 'PAID', 'CANCELLED'],
  PAID: [],
  CANCELLED: [],
};

const toCents = (value: { toString(): string } | null | undefined): bigint => {
  if (!value) return 0n;
  const [integer, fraction = ''] = value.toString().split('.');
  const cents = BigInt(integer + fraction.padEnd(2, '0').slice(0, 2));
  return cents;
};

const fromCents = (cents: bigint): string => {
  const negative = cents < 0n;
  const abs = negative ? -cents : cents;
  const integer = abs / 100n;
  const fraction = (abs % 100n).toString().padStart(2, '0');
  return `${negative ? '-' : ''}${integer}.${fraction}`;
};

@Injectable()
export class FinanceService {
  constructor(
    private readonly systemRole: SystemPropertyService,
    private readonly repository: FinanceRepository,
  ) {}

  private async authorize(
    user: AuthUser,
    propertyId: string,
    policy: keyof typeof POLICIES_STATEMENTS_NAMES,
  ) {
    const member =
      await this.systemRole.verifyPropertyMemberByUserIdInPropertyId(
        user.userId,
        propertyId,
      );
    await this.systemRole.CheckPolicies(member.id, [
      POLICIES_STATEMENTS_NAMES[policy],
    ]);

    if (!(await this.repository.findPropertyById(propertyId))) {
      throw new FinancePropertyNotFound();
    }

    return member;
  }

  private async assertContractBelongsToProperty(
    contractId: string,
    propertyId: string,
  ) {
    const contract = await this.repository.findContractById(contractId);
    if (!contract) throw new FinanceContractNotFound();
    if (contract.propertyId !== propertyId) {
      throw new FinanceContractPropertyMismatch();
    }
  }

  private resolvePaidAt(paidAt: Date | undefined): Date {
    const now = new Date();
    if (paidAt && paidAt.getTime() > now.getTime()) {
      throw new FinancialInvalidData(
        'La fecha de pago no puede estar en el futuro!',
      );
    }
    return paidAt ?? now;
  }

  async create(
    user: AuthUser,
    propertyId: string,
    dto: CreateFinancialTransactionType,
  ) {
    await this.authorize(user, propertyId, 'REGISTRAR_MOVIMIENTOS_FINANCIEROS');

    if (dto.contractId) {
      await this.assertContractBelongsToProperty(dto.contractId, propertyId);
    }

    return await this.repository.create({
      propertyId,
      contractId: dto.contractId ?? null,
      type: dto.type,
      category: dto.category,
      status: dto.status,
      description: dto.description,
      amount: dto.amount,
      currency: dto.currency,
      dueDate: dto.dueDate ?? null,
      ...(dto.occurredAt && { occurredAt: dto.occurredAt }),
      paidAt: dto.status === 'PAID' ? this.resolvePaidAt(dto.paidAt) : null,
      isSimulated: dto.isSimulated,
    });
  }

  async assertCanRegister(user: AuthUser, propertyId: string) {
    await this.authorize(user, propertyId, 'REGISTRAR_MOVIMIENTOS_FINANCIEROS');
  }

  async findById(user: AuthUser, propertyId: string, id: string) {
    await this.authorize(user, propertyId, 'VER_FINANZAS');

    const transaction = await this.repository.findByIdAndPropertyId(
      id,
      propertyId,
    );
    if (!transaction) throw new FinancialTransactionNotFound();

    return transaction;
  }

  async findAll(
    user: AuthUser,
    propertyId: string,
    query: ListFinancialTransactionsQueryType,
  ) {
    await this.authorize(user, propertyId, 'VER_FINANZAS');
    return await this.repository.findAllByPropertyId(propertyId, query, true);
  }

  async findHistory(
    user: AuthUser,
    propertyId: string,
    query: ListFinancialTransactionsQueryType,
  ) {
    await this.authorize(user, propertyId, 'VER_FINANZAS');
    return await this.repository.findAllByPropertyId(propertyId, query, false);
  }

  async update(
    user: AuthUser,
    propertyId: string,
    id: string,
    dto: UpdateFinancialTransactionType,
  ) {
    await this.authorize(user, propertyId, 'EDITAR_MOVIMIENTOS_FINANCIEROS');

    const current = await this.repository.findByIdAndPropertyId(id, propertyId);
    if (!current) throw new FinancialTransactionNotFound();
    if (current.status === 'PAID' || current.status === 'CANCELLED') {
      throw new FinancialTransactionImmutable();
    }

    if (dto.contractId) {
      await this.assertContractBelongsToProperty(dto.contractId, propertyId);
    }

    const updated = await this.repository.updateIfStatus(
      id,
      propertyId,
      current.status,
      {
        ...(dto.contractId !== undefined && { contractId: dto.contractId }),
        ...(dto.category && { category: dto.category }),
        ...(dto.description && { description: dto.description }),
        ...(dto.amount && { amount: dto.amount }),
        ...(dto.currency && { currency: dto.currency }),
        ...(dto.dueDate !== undefined && { dueDate: dto.dueDate }),
        ...(dto.occurredAt && { occurredAt: dto.occurredAt }),
      },
    );
    if (!updated) throw new FinancialTransactionConcurrentUpdate();

    return updated;
  }

  async changeStatus(
    user: AuthUser,
    propertyId: string,
    id: string,
    dto: ChangeFinancialStatusType,
  ) {
    await this.authorize(user, propertyId, 'EDITAR_MOVIMIENTOS_FINANCIEROS');

    const current = await this.repository.findByIdAndPropertyId(id, propertyId);
    if (!current) throw new FinancialTransactionNotFound();
    if (current.status === 'PAID' || current.status === 'CANCELLED') {
      throw new FinancialTransactionImmutable();
    }

    if (!ALLOWED_TRANSITIONS[current.status].includes(dto.status)) {
      throw new FinancialTransactionInvalidTransition(
        current.status,
        dto.status,
      );
    }

    const updated = await this.repository.updateIfStatus(
      id,
      propertyId,
      current.status,
      {
        status: dto.status,
        ...(dto.status === 'PAID' && {
          paidAt: this.resolvePaidAt(dto.paidAt),
        }),
      },
    );
    if (!updated) throw new FinancialTransactionConcurrentUpdate();

    return updated;
  }

  async markAsPaid(
    user: AuthUser,
    propertyId: string,
    id: string,
    dto: MarkAsPaidType,
  ) {
    return await this.changeStatus(user, propertyId, id, {
      status: 'PAID',
      paidAt: dto.paidAt,
    });
  }

  async getSummary(
    user: AuthUser,
    propertyId: string,
    query: FinancialSummaryQueryType,
  ) {
    await this.authorize(user, propertyId, 'VER_FINANZAS');

    const { realized, pending, overdue } =
      await this.repository.aggregateSummary(
        propertyId,
        query.from,
        query.to,
        new Date(),
      );

    const currencies = new Set<Currency>();
    [realized, pending, overdue].forEach((rows) =>
      rows.forEach((row) => currencies.add(row.currency)),
    );

    const pick = (
      rows: GroupRow[],
      currency: Currency,
      type: TransactionType,
    ) => rows.find((row) => row.currency === currency && row.type === type);

    const byCurrency = [...currencies].sort().map((currency) => {
      const realizedIncome = toCents(
        pick(realized, currency, 'INCOME')?._sum.amount,
      );
      const realizedExpense = toCents(
        pick(realized, currency, 'EXPENSE')?._sum.amount,
      );

      return {
        currency,
        realizedIncome: fromCents(realizedIncome),
        realizedExpense: fromCents(realizedExpense),
        netCashFlow: fromCents(realizedIncome - realizedExpense),
        pendingIncome: fromCents(
          toCents(pick(pending, currency, 'INCOME')?._sum.amount),
        ),
        pendingExpense: fromCents(
          toCents(pick(pending, currency, 'EXPENSE')?._sum.amount),
        ),
        overdue: {
          count:
            (pick(overdue, currency, 'INCOME')?._count._all ?? 0) +
            (pick(overdue, currency, 'EXPENSE')?._count._all ?? 0),
          income: fromCents(
            toCents(pick(overdue, currency, 'INCOME')?._sum.amount),
          ),
          expense: fromCents(
            toCents(pick(overdue, currency, 'EXPENSE')?._sum.amount),
          ),
        },
      };
    });

    return {
      propertyId,
      period: { from: query.from, to: query.to },
      byCurrency,
    };
  }
}
