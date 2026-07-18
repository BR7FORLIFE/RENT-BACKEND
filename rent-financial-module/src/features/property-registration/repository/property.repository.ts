import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service.js';
import type {
  PropertyMemberRoleType,
  PropertyMemberType,
  PropertyType,
  ResourceImageType,
} from '../schemas/property-registration.schema.js';
import type {
  PaginationResponse,
  PaginationType,
} from '../../../shared/pagination/pagination-schemas.js';
import type { PropertyInfoResponse } from '../dtos/response-dto.js';
import type { Prisma } from '../../../../generated/prisma/client.js';

@Injectable()
export class PropertyRepository {
  constructor(private readonly prisma: PrismaService) {}

  //find properties
  async findAll(
    userId: string,
    paginationDto: PaginationType,
    db: Prisma.TransactionClient = this.prisma,
  ): Promise<PaginationResponse<PropertyInfoResponse>> {
    const { limit, page } = paginationDto;
    const skip = (paginationDto.page - 1) * paginationDto.limit;

    const [data, total] = await db.$transaction([
      db.property.findMany({
        where: { userId },
        skip,
        take: limit,
        select: {
          id: true,
          fmi: true,
          predialNumber: true,
          isPublished: true,
          createAt: true,
          propertyDescription: true,
          propertyName: true,

          typeProperty: {
            select: {
              name: true,
            },
          },

          propertyOccupationType: {
            select: {
              name: true,
            },
          },

          direction: true,
          resourceImages: true,
        },
      }),
      db.property.count({
        where: { userId },
      }),
    ]);

    return {
      data,
      metadata: {
        limit: limit,
        page,
        hasNextPage: page * limit < total,
        hasPreviousPage: page > 1,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
  async findByFMIOrPredialNumber(
    userId: string,
    fmi: string | null,
    predialNumber: string | null,
    db: Prisma.TransactionClient = this.prisma,
  ) {
    if (fmi) {
      return await db.property.findFirst({
        where: {
          userId,
          fmi,
        },
      });
    }
    if (predialNumber) {
      return await this.prisma.property.findFirst({
        where: {
          userId,
          predialNumber,
        },
      });
    }

    return null;
  }

  async findPropertyById(
    userId: string,
    id: string,
    db: Prisma.TransactionClient = this.prisma,
  ) {
    return await db.property.findFirst({
      where: { userId, id },
      select: {
        id: true,
        fmi: true,
        predialNumber: true,
        isPublished: true,
        createAt: true,
        propertyDescription: true,
        propertyName: true,

        typeProperty: {
          select: {
            name: true,
          },
        },

        propertyOccupationType: {
          select: {
            name: true,
          },
        },

        direction: true,
        resourceImages: true,
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

  async findAssetsResourcesByPropertyId(
    propertyId: string,
    db: Prisma.TransactionClient = this.prisma,
  ) {
    return await db.resourceImages.findMany({
      where: {
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

  //save functions
  async saveProperty(
    property: PropertyType,
    resourcesImages: ResourceImageType[],
    db: Prisma.TransactionClient = this.prisma,
  ) {
    return await db.property.create({
      data: {
        ...property,
        resourceImages: {
          create: resourcesImages,
        },
      },
    });
  }

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

  //update functions
  async updateProperty(
    id: string,
    userId: string,
    data: Prisma.PropertyUpdateInput,
    db: Prisma.TransactionClient = this.prisma,
  ) {
    return await db.property.update({
      where: {
        id,
        userId,
      },
      data,
    });
  }

  async updateResourcesImages(
    toDelete: string[],
    toInsert: Prisma.ResourceImagesCreateManyInput[],
    db: Prisma.TransactionClient = this.prisma,
  ): Promise<void> {
    await db.$transaction(async (tx) => {
      if (toDelete.length > 0) {
        await tx.resourceImages.deleteMany({
          where: {
            assetId: {
              in: toDelete,
            },
          },
        });
      }

      if (toInsert.length > 0) {
        await tx.resourceImages.createMany({
          data: toInsert,
        });
      }
    });
  }
}
