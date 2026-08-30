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
      id: string;
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
          id: true,
          userId: true,
          status: true,
          assignedAt: true,
          propertyId: true,
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

  async findPropertyMemberByPropertyMemberId(
    propertyMemberId: string,
    db: Prisma.TransactionClient = this.prisma,
  ) {
    return await db.propertyMember.findFirst({
      where: {
        id: propertyMemberId,
      },
    });
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

  async findPropertyMemberWithRolesByPropertyMemberIdAndPropertyId(
    propertyMemberId: string,
    propertyId: string,
    db: Prisma.TransactionClient = this.prisma,
  ) {
    return await db.propertyMember.findFirst({
      where: {
        userId: propertyMemberId,
        propertyId,
      },
      select: {
        id: true,
        userId: true,
        propertyId: true,
        status: true,
        assignedBy: true,
        assignedAt: true,
        updateAt: true,

        propertyMemberRole: {
          select: {
            propertyActorRole: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
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

  async savePropertyMemberWithRoles(
    propertyMemberId: string,
    propertyActorRoleIds: string[],
    db: Prisma.TransactionClient = this.prisma,
  ) {
    await db.propertyMemberRole.createMany({
      data: propertyActorRoleIds.map((roleId) => ({
        propertyMemberId,
        propertyActorRoleId: roleId,
      })),
    });
  }

  async savePropertyMemberRole(
    properyMemberRole: PropertyMemberRoleType,
    db: Prisma.TransactionClient = this.prisma,
  ) {
    return await db.propertyMemberRole.create({
      data: properyMemberRole,
    });
  }

  //updates
  async updatePropertyMemberStatus(
    id: string,
    status: PropertyMemberStatus,
    db: Prisma.TransactionClient = this.prisma,
  ) {
    return db.propertyMember.update({
      where: {
        id,
      },
      data: {
        status,
      },
    });
  }
}
