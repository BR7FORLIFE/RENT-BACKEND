import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service.js';
import type {
  PropertyMemberRoleType,
  PropertyMemberType,
  PropertyType,
} from '../schemas/property-registration.schema.js';
import type {
  PaginationResponse,
  PaginationType,
} from '../../../shared/pagination/pagination-schemas.js';
import type { PropertyInfoResponse } from '../dtos/response-dto.js';
import type { Prisma } from '../../../../generated/prisma/client.js';
import type {
  PropertyActorRoleType,
  PropertyOccupationType,
  TypePropertyType,
} from '../types.js';

@Injectable()
export class PropertyRepository {
  constructor(private readonly prisma: PrismaService) {}

  //find properties
  async findAll(
    userId: string,
    paginationDto: PaginationType,
  ): Promise<PaginationResponse<PropertyInfoResponse>> {
    const { limit, page } = paginationDto;
    const skip = (paginationDto.page - 1) * paginationDto.limit;

    const [data, total] = await this.prisma.$transaction([
      this.prisma.property.findMany({
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
          resourceImage: true,
        },
      }),
      this.prisma.property.count({
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
  ) {
    if (fmi) {
      return await this.prisma.property.findFirst({
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

  async findPropertyById(userId: string, id: string) {
    return await this.prisma.property.findFirst({
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
        resourceImage: true,
      },
    });
  }

  async findPropertyMemberByUserIdAndPropertyId(
    userId: string,
    propertyId: string,
  ) {
    return await this.prisma.propertyMember.findFirst({
      where: {
        userId,
        propertyId,
      },
    });
  }

  async findPropertyOccupationTypeByName(name: PropertyOccupationType) {
    return await this.prisma.propertyOccupationType.findFirst({
      where: {
        name,
      },
    });
  }

  async findTypePropertyByName(name: TypePropertyType) {
    return await this.prisma.typeProperty.findFirst({
      where: {
        name,
      },
    });
  }

  async findPropertyActorRoleByName(name: PropertyActorRoleType) {
    return await this.prisma.propertyActorRole.findFirst({
      where: {
        name,
      },
    });
  }

  //save functions
  async saveProperty(property: PropertyType) {
    return await this.prisma.property.create({
      data: property,
    });
  }

  async savePropertyMember(propertyMember: PropertyMemberType) {
    return await this.prisma.propertyMember.create({ data: propertyMember });
  }

  async savePropertyMemberRole(properyMemberRole: PropertyMemberRoleType) {
    return await this.prisma.propertyMemberRole.create({
      data: properyMemberRole,
    });
  }

  //update functions
  async updateProperty(
    id: string,
    userId: string,
    data: Prisma.PropertyUpdateInput,
  ) {
    return await this.prisma.property.update({
      where: {
        id,
        userId,
      },
      data,
    });
  }
}
