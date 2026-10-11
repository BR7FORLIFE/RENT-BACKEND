import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service.js';
import type { Prisma } from '../../../../generated/prisma/client.js';
import type { ListOfferingsQueryType } from '../dtos/request-dto.js';

const offeringInclude = {
  service: { select: { id: true, name: true, isActive: true } },
  propertyMember: { select: { id: true, propertyId: true, status: true } },
} satisfies Prisma.ServiceOfferingInclude;

export interface OfferingListScope {
  // usuario autenticado: define la visibilidad de las ofertas
  userId: string;
  // true: solo ofertas propias (endpoint /mine)
  onlyMine?: boolean;
  // true: administrador autorizado, ve todo
  isAdmin?: boolean;
}

@Injectable()
export class ServiceOfferingRepository {
  constructor(private readonly prisma: PrismaService) {}

  // Visibilidad: lo propio siempre; lo ajeno solo si esta ACTIVE, su servicio esta activo y es
  // PUBLIC o PROPERTY de un inmueble donde el usuario es miembro ACTIVE.
  private buildWhere(
    filters: ListOfferingsQueryType,
    scope: OfferingListScope,
  ): Prisma.ServiceOfferingWhereInput {
    const now = new Date();
    const and: Prisma.ServiceOfferingWhereInput[] = [];

    if (scope.onlyMine) {
      and.push({ providerUserId: scope.userId });
    } else if (!scope.isAdmin) {
      and.push({
        OR: [
          { providerUserId: scope.userId },
          {
            status: 'ACTIVE',
            service: { isActive: true },
            OR: [
              { scope: 'PUBLIC' },
              {
                scope: 'PROPERTY',
                propertyMember: {
                  property: {
                    propertyMembers: {
                      some: { userId: scope.userId, status: 'ACTIVE' },
                    },
                  },
                },
              },
            ],
          },
        ],
      });
    }

    if (filters.serviceId) and.push({ serviceId: filters.serviceId });
    if (filters.providerUserId)
      and.push({ providerUserId: filters.providerUserId });
    if (filters.scope) and.push({ scope: filters.scope });
    if (filters.status) and.push({ status: filters.status });
    if (filters.currency) and.push({ currency: filters.currency });
    if (filters.minPrice) and.push({ basePrice: { gte: filters.minPrice } });
    if (filters.maxPrice) and.push({ basePrice: { lte: filters.maxPrice } });
    if (filters.onlyValid) {
      and.push({
        status: 'ACTIVE',
        service: { isActive: true },
        validFrom: { lte: now },
        OR: [{ validUntil: null }, { validUntil: { gte: now } }],
      });
    }

    return { AND: and };
  }

  async findAll(
    filters: ListOfferingsQueryType,
    scope: OfferingListScope,
    db: Prisma.TransactionClient = this.prisma,
  ) {
    const { page, limit, sortBy, sortOrder } = filters;
    const where = this.buildWhere(filters, scope);

    const [data, total] = await Promise.all([
      db.serviceOffering.findMany({
        where,
        include: offeringInclude,
        orderBy: [{ [sortBy]: sortOrder }, { id: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.serviceOffering.count({ where }),
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
    return await db.serviceOffering.findUnique({
      where: { id },
      include: offeringInclude,
    });
  }

  async create(
    data: Prisma.ServiceOfferingUncheckedCreateInput,
    db: Prisma.TransactionClient = this.prisma,
  ) {
    return await db.serviceOffering.create({
      data,
      include: offeringInclude,
    });
  }

  async update(
    id: string,
    data: Prisma.ServiceOfferingUncheckedUpdateInput,
    db: Prisma.TransactionClient = this.prisma,
  ) {
    return await db.serviceOffering.update({
      where: { id },
      data,
      include: offeringInclude,
    });
  }

  // membresia usada para validar que el proveedor es dueño del vinculo con el inmueble
  async findPropertyMember(
    id: string,
    db: Prisma.TransactionClient = this.prisma,
  ) {
    return await db.propertyMember.findUnique({
      where: { id },
      select: { id: true, userId: true, propertyId: true, status: true },
    });
  }
}
