import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service.js';
import type { Prisma } from '../../../../generated/prisma/client.js';
import type { ListServiceRequestsQueryType } from '../dtos/request-dto.js';

const requestInclude = {
  offering: {
    select: {
      id: true,
      scope: true,
      priceTypeAgreement: true,
      service: { select: { id: true, name: true } },
    },
  },
  property: { select: { id: true, propertyName: true } },
} satisfies Prisma.ServiceRequestInclude;

const requestDetailInclude = {
  ...requestInclude,
  history: { orderBy: { createdAt: 'asc' } },
} satisfies Prisma.ServiceRequestInclude;

export interface HistoryEntry {
  action: Prisma.ServiceRequestHistoryUncheckedCreateInput['action'];
  fromStatus: Prisma.ServiceRequestHistoryUncheckedCreateInput['fromStatus'];
  toStatus: Prisma.ServiceRequestHistoryUncheckedCreateInput['toStatus'];
  actorUserId: string;
  reason?: string;
}

@Injectable()
export class ServiceRequestRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    where: Prisma.ServiceRequestWhereInput,
    pagination: ListServiceRequestsQueryType,
    db: Prisma.TransactionClient = this.prisma,
  ) {
    const { page, limit, status } = pagination;
    const finalWhere: Prisma.ServiceRequestWhereInput = {
      AND: [where, ...(status ? [{ status }] : [])],
    };

    const [data, total] = await Promise.all([
      db.serviceRequest.findMany({
        where: finalWhere,
        include: requestInclude,
        orderBy: [{ requestedAt: 'desc' }, { id: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.serviceRequest.count({ where: finalWhere }),
    ]);

    return {
      data,
      metadata: {
        limit,
        page,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPreviousPage: page > 1,
      },
    };
  }

  async findById(id: string, db: Prisma.TransactionClient = this.prisma) {
    return await db.serviceRequest.findUnique({
      where: { id },
      include: requestDetailInclude,
    });
  }

  async create(
    data: Prisma.ServiceRequestUncheckedCreateInput,
    db: Prisma.TransactionClient = this.prisma,
  ) {
    return await db.serviceRequest.create({ data });
  }

  // Actualizacion condicionada al estado (y opcionalmente a otras columnas): devuelve cuantas
  // filas cambio. 0 => otra operacion concurrente gano la carrera.
  async updateIf(
    id: string,
    expected: Prisma.ServiceRequestWhereInput,
    data: Prisma.ServiceRequestUncheckedUpdateManyInput,
    db: Prisma.TransactionClient = this.prisma,
  ) {
    const { count } = await db.serviceRequest.updateMany({
      where: { id, ...expected },
      data,
    });
    return count;
  }

  // El historial solo admite insercion (no hay update/delete en este repositorio)
  async addHistory(
    serviceRequestId: string,
    entry: HistoryEntry,
    db: Prisma.TransactionClient = this.prisma,
  ) {
    return await db.serviceRequestHistory.create({
      data: { serviceRequestId, ...entry },
    });
  }

  async findActiveMembership(
    userId: string,
    propertyId: string,
    db: Prisma.TransactionClient = this.prisma,
  ) {
    return await db.propertyMember.findFirst({
      where: { userId, propertyId, status: 'ACTIVE' },
      select: { id: true },
    });
  }
}
