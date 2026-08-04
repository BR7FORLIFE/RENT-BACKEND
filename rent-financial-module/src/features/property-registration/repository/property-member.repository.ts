import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service.js';
import type { Prisma } from '../../../../generated/prisma/client.js';
import type {
  PropertyMemberRoleType,
  PropertyMemberStatus,
  PropertyMemberType,
} from '../schemas/property-registration.schema.js';
import type {
  PaginationResponse,
  PaginationType,
} from '../../../shared/pagination/pagination-schemas.js';

@Injectable()
export class PropertyMemberRepository {
  constructor(private prisma: PrismaService) {}

  //finds
  async findAll(
    db: Prisma.TransactionClient = this.prisma,
    propertyId: string,
    status: PropertyMemberStatus,
    paginationDto: PaginationType,
  ): Promise<
    PaginationResponse<{
      userId: string;
      status: PropertyMemberStatus;
      assignedAt: Date;
    }>
  > {
    const { page, limit } = paginationDto;
    const skip = (paginationDto.page - 1) * paginationDto.limit;

    const [data, total] = await db.$transaction([
      db.propertyMember.findMany({
        where: {
          propertyId,
          status,
        },
        skip,
        take: limit,
        select: {
          userId: true,
          status: true,
          assignedAt: true,
        },
      }),
      db.propertyMember.count({
        where: { propertyId, status },
      }),
    ]);

    return {
      data,
      metadata: {
        limit,
        page,
        hasNextPage: page * limit < total,
        hasPreviousPage: page > 1,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findPropertyMemberByUserIdAndPropertyId(
    userId: string,
    propertyId: string,
    db: Prisma.TransactionClient = this.prisma,
  ) {
    return await db.propertyMember.findFirst({
      where: {
        userId,
        propertyId,
      },
    });
  }

  async findActorRoleByUserId(
    userId: string,
    db: Prisma.TransactionClient = this.prisma,
  ) {
    return db.propertyActorRole.findMany({
      where: {
        propertyMemberRoles: {
          some: {
            propertyMember: {
              userId,
            },
          },
        },
      },
      select: {
        name: true,
      },
    });
  }

  //saves
  async savePropertyMember(
    propertyMember: PropertyMemberType,
    db: Prisma.TransactionClient = this.prisma,
  ) {
    return await db.propertyMember.create({ data: propertyMember });
  }

  async savePropertyMemberRole(
    properyMemberRole: PropertyMemberRoleType,
    db: Prisma.TransactionClient = this.prisma,
  ) {
    return await db.propertyMemberRole.create({
      data: properyMemberRole,
    });
  }
}
