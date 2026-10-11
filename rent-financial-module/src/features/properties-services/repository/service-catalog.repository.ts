import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service.js';
import type { Prisma } from '../../../../generated/prisma/client.js';
import type {
  PaginationResponse,
  PaginationType,
} from '../../../shared/pagination/pagination-schemas.js';

@Injectable()
export class ServiceCatalogRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    filters: PaginationType & { search?: string; isActive?: boolean },
    db: Prisma.TransactionClient = this.prisma,
  ) {
    const { page, limit, search, isActive } = filters;
    const where: Prisma.ServiceWhereInput = {
      ...(isActive !== undefined && { isActive }),
      ...(search && { name: { contains: search, mode: 'insensitive' } }),
    };

    const [data, total] = await Promise.all([
      db.service.findMany({
        where,
        orderBy: [{ name: 'asc' }, { id: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.service.count({ where }),
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
    } satisfies PaginationResponse<(typeof data)[number]>;
  }

  async findById(id: string, db: Prisma.TransactionClient = this.prisma) {
    return await db.service.findUnique({ where: { id } });
  }

  async findByName(name: string, db: Prisma.TransactionClient = this.prisma) {
    return await db.service.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } },
    });
  }

  async create(
    data: { name: string; description: string },
    db: Prisma.TransactionClient = this.prisma,
  ) {
    return await db.service.create({ data });
  }

  async update(
    id: string,
    data: { name?: string; description?: string; isActive?: boolean },
    db: Prisma.TransactionClient = this.prisma,
  ) {
    return await db.service.update({ where: { id }, data });
  }
}
