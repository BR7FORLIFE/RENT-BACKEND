import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service.js';
import type {
  PropertyType,
  ResourceImageType,
} from '../schemas/property-registration.schema.js';
import type {
  PaginationResponse,
  PaginationType,
} from '../../../shared/pagination/pagination-schemas.js';
import type { PropertyInfoResponse } from '../dtos/response-dto.js';
import { Prisma } from '../../../../generated/prisma/client.js';

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

          propertyResources: {
            select: {
              resourcesImage: true,
            },
          },

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
      db.property.count({
        where: { userId },
      }),
    ]);

    //transformamos con un dto la respuesta que enviaremos al servidor
    const transformData: PropertyInfoResponse[] = data.map((res) => ({
      id: res.id,
      createAt: res.createAt,
      fmi: res.fmi,
      predialNumber: res.predialNumber,
      isPublished: res.isPublished,
      propertyName: res.propertyName,
      propertyDescription: res.propertyDescription,
      direction: res.direction,
      typeProperty: res.typeProperty.name,
      propertyOccupationType: res.propertyOccupationType.name,
      resourceImages: res.propertyResources.map(
        (resources) => resources.resourcesImage,
      ),
    }));

    return {
      data: transformData,
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
    const data = await db.property.findFirst({
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
        propertyResources: {
          select: {
            resourcesImage: true,
          },
        },
      },
    });

    if (!data) return null;

    const transformData: PropertyInfoResponse = {
      id: data.id,
      createAt: data.createAt,
      fmi: data.fmi,
      predialNumber: data.predialNumber,
      isPublished: data.isPublished,
      propertyName: data.propertyName,
      propertyDescription: data.propertyDescription,
      direction: data.direction,
      typeProperty: data.typeProperty.name,
      propertyOccupationType: data.propertyOccupationType.name,
      resourceImages: data.propertyResources.map(
        (resources) => resources.resourcesImage,
      ),
    };

    return transformData;
  }

  async findAssetsResourcesByPropertyId(
    propertyId: string,
    db: Prisma.TransactionClient = this.prisma,
  ) {
    return await db.propertyResources.findMany({
      where: {
        propertyId,
      },
      select: {
        resourcesImage: true,
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
        propertyResources: {
          create: resourcesImages.map((resource) => ({
            resourcesImage: {
              create: {
                assetId: resource.assetId,
                url: resource.url,
                width: resource.width,
                height: resource.height,
                format: resource.format,
                secureUrl: resource.secureUrl,
              },
            },
          })),
        },
      },
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
