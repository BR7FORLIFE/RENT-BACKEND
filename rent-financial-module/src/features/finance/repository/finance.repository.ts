import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service.js';
import type { Prisma } from '../../../../generated/prisma/client.js';
import type { FinancialRecordStatus } from '../../../../generated/prisma/enums.js';
import type { ListFinancialTransactionsQueryType } from '../dtos/request-dto.js';

type RecordStatus = FinancialRecordStatus;

const UNPAID_STATUSES: RecordStatus[] = ['PLANNED', 'PENDING', 'OVERDUE'];
const OVERDUE_CANDIDATE_STATUSES: RecordStatus[] = ['PLANNED', 'PENDING'];

@Injectable()
export class FinanceRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findPropertyById(
    propertyId: string,
    db: Prisma.TransactionClient = this.prisma,
  ) {
    return await db.property.findUnique({
      where: { id: propertyId },
      select: { id: true },
    });
  }

  async findContractById(
    contractId: string,
    db: Prisma.TransactionClient = this.prisma,
  ) {
    return await db.contract.findUnique({
      where: { id: contractId },
      select: { id: true, propertyId: true },
    });
  }

  async create(
    data: Prisma.FinancialTransactionUncheckedCreateInput,
    db: Prisma.TransactionClient = this.prisma,
  ) {
    return await db.financialTransaction.create({ data });
  }

  async findByIdAndPropertyId(
    id: string,
    propertyId: string,
    db: Prisma.TransactionClient = this.prisma,
  ) {
    return await db.financialTransaction.findFirst({
      where: { id, propertyId },
    });
  }

  async updateIfStatus(
    id: string,
    propertyId: string,
    expectedStatus: RecordStatus,
    data: Prisma.FinancialTransactionUncheckedUpdateManyInput,
    db: Prisma.TransactionClient = this.prisma,
  ) {
    const { count } = await db.financialTransaction.updateMany({
      where: { id, propertyId, status: expectedStatus },
      data,
    });

    if (count === 0) return null;

    return await db.financialTransaction.findFirst({
      where: { id, propertyId },
    });
  }

  private buildWhere(
    propertyId: string,
    filters: Omit<ListFinancialTransactionsQueryType, 'page' | 'limit'>,
    excludeCancelled: boolean,
  ): Prisma.FinancialTransactionWhereInput {
    const {
      type,
      category,
      status,
      currency,
      contractId,
      isSimulated,
      from,
      to,
    } = filters;

    return {
      propertyId,
      ...(type && { type }),
      ...(category && { category }),
      ...(currency && { currency }),
      ...(contractId && { contractId }),
      ...(isSimulated !== undefined && { isSimulated }),
      ...(status
        ? { status }
        : excludeCancelled
          ? { status: { not: 'CANCELLED' as const } }
          : {}),
      ...((from || to) && {
        occurredAt: { ...(from && { gte: from }), ...(to && { lte: to }) },
      }),
    };
  }

  async findAllByPropertyId(
    propertyId: string,
    query: ListFinancialTransactionsQueryType,
    excludeCancelled: boolean,
    db: Prisma.TransactionClient = this.prisma,
  ) {
    const { page, limit, ...filters } = query;
    const where = this.buildWhere(propertyId, filters, excludeCancelled);

    const [data, total] = await Promise.all([
      db.financialTransaction.findMany({
        where,
        orderBy: [{ occurredAt: 'desc' }, { createdAt: 'desc' }, { id: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.financialTransaction.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      metadata: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async aggregateSummary(
    propertyId: string,
    from: Date,
    to: Date,
    now: Date,
    db: Prisma.TransactionClient = this.prisma,
  ) {
    const period = { propertyId, occurredAt: { gte: from, lte: to } };

    const group = (where: Prisma.FinancialTransactionWhereInput) =>
      db.financialTransaction.groupBy({
        by: ['type', 'currency'],
        where,
        _sum: { amount: true },
        _count: { _all: true },
      });

    const [realized, pending, overdue] = await Promise.all([
      group({ ...period, status: 'PAID' }),
      group({ ...period, status: { in: UNPAID_STATUSES } }),
      group({
        ...period,
        OR: [
          { status: 'OVERDUE' },
          {
            status: { in: OVERDUE_CANDIDATE_STATUSES },
            dueDate: { lt: now },
          },
        ],
      }),
    ]);

    return { realized, pending, overdue };
  }
}
