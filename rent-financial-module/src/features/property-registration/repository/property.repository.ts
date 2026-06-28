import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service.js';
import type {
  DirectionType,
  PropertyType,
} from '../schemas/property-registration.schema.js';
import type {
  PaginationResponse,
  PaginationType,
} from '../../../shared/pagination/pagination-schemas.js';
import type { PropertyInfoResponse } from '../dtos/response/response-dto.js';

@Injectable()
export class PropertyRepository {
  constructor(private readonly prisma: PrismaService) {}

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

  async findByFMIOrPredialNumber(fmi: string, predialNumber: string) {
    return await this.prisma.property.findFirst({
      where: {
        OR: [{ fmi }, { predialNumber: predialNumber }],
      },
    });
  }

  async findPropertyOccupationTypeByName(name: string) {
    return await this.prisma.propertyOccupationType.findFirst({
      where: {
        name,
      },
    });
  }

  async findTypePropertyByName(name: string) {
    return await this.prisma.typeProperty.findFirst({
      where: {
        name,
      },
    });
  }

  async saveProperty(property: PropertyType) {
    return await this.prisma.property.create({
      data: property,
    });
  }

  async saveDirection(direction: DirectionType) {
    return await this.prisma.direction.create({ data: direction });
  }
}
