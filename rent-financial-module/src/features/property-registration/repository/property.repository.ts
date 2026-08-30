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
import { Prisma } from '../../../../generated/prisma/client.js';
import type {
  CreateEconomicPropertyInfoType,
  CreateStructurePropertyInfo,
} from '../dtos/request-dto.js';
import type {
  PropertyInfoPersistence,
  PropertyNameAndDescriptionPersistance,
  ResourceImagePersistence,
} from './repository-types.js';

@Injectable()
export class PropertyRepository {
  constructor(private readonly prisma: PrismaService) {}

  //find properties
  async findAll(
    userId: string,
    paginationDto: PaginationType,
    db: Prisma.TransactionClient = this.prisma,
  ): Promise<PaginationResponse<PropertyInfoPersistence>> {
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

          economicPropertyInformation: {
            select: {
              monthlyRent: true,
              depositAmount: true,
              currency: true,
              utilitiesIncluded: true,
            },
          },

          propertyStructureDescription: {
            select: {
              bedrooms: true,
              bathrooms: true,
              floors: true,
              parkingSpaces: true,
              area: true,
              lotArea: true,
              constructionYear: true,
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
    const transformData: PropertyInfoPersistence[] = data.map((res) => ({
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
      economicInfoResponse: res.economicPropertyInformation,
      structureInfoResponse: res.propertyStructureDescription,
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

        economicPropertyInformation: true,
        propertyStructureDescription: true,
      },
    });

    if (!data) return null;

    const transformData: PropertyInfoPersistence = {
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
      economicInfoResponse: data.economicPropertyInformation,
      structureInfoResponse: data.propertyStructureDescription,
    };

    return transformData;
  }

  async findPropertyByIdAndPropertyMemberId(
    propertyMemberId: string,
    id: string,
    db: Prisma.TransactionClient = this.prisma,
  ) {
    const data = await db.propertyMember.findFirst({
      where: { id: propertyMemberId, propertyId: id },
      select: {
        property: {
          select: {
            id: true,
            createAt: true,
            fmi: true,
            predialNumber: true,
            isPublished: true,
            propertyName: true,
            propertyDescription: true,
            typeProperty: true,
            propertyOccupationType: true,
            propertyResources: {
              select: {
                resourcesImage: true,
              },
            },
            economicPropertyInformation: true,
            propertyStructureDescription: true,

            direction: true,
          },
        },
      },
    });

    if (!data) return null;

    const transformData: PropertyInfoPersistence = {
      id: data.property.id,
      createAt: data.property.createAt,
      fmi: data.property.fmi,
      predialNumber: data.property.predialNumber,
      isPublished: data.property.isPublished,
      propertyName: data.property.propertyName,
      propertyDescription: data.property.propertyDescription,
      direction: data.property.direction,
      typeProperty: data.property.typeProperty.name,
      propertyOccupationType: data.property.propertyOccupationType.name,
      resourceImages: data.property.propertyResources.map(
        (resources) => resources.resourcesImage,
      ),
      economicInfoResponse: data.property.economicPropertyInformation,
      structureInfoResponse: data.property.propertyStructureDescription,
    };

    return transformData;
  }

  async findAllPartialPropertyInfoByPropertyMemberId(
    userId: string,
    status: 'ACTIVE' | 'IN_PROCESS',
    paginationDto: PaginationType,
    db: Prisma.TransactionClient = this.prisma,
  ): Promise<PaginationResponse<PropertyNameAndDescriptionPersistance>> {
    const { page, limit } = paginationDto;
    const skip = (paginationDto.page - 1) * paginationDto.limit;

    const [data, total] = await db.$transaction([
      db.property.findMany({
        where: {
          propertyMembers: {
            some: {
              userId,
              status,
            },
          },
        },
        skip,
        take: limit,
        select: {
          id: true,
          propertyName: true,
          propertyDescription: true,
        },
      }),

      db.property.count({
        where: {
          propertyMembers: {
            some: {
              userId,
            },
          },
        },
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

  async findPartialPropertyInfoByPropertyMemberId(
    userId: string,
    propertyId: string,
    db: Prisma.TransactionClient = this.prisma,
  ) {
    return await db.property.findFirst({
      where: {
        id: propertyId,
        propertyMembers: {
          some: {
            userId,
          },
        },
      },
      select: {
        propertyName: true,
        propertyDescription: true,
      },
    });
  }

  async findAllAssetsResourcesByPropertyId(
    propertyId: string,
    paginationDto: PaginationType,
    db: Prisma.TransactionClient = this.prisma,
  ): Promise<PaginationResponse<ResourceImagePersistence>> {
    const { page, limit } = paginationDto;
    const skip = paginationDto.page - 1 * paginationDto.limit;

    const [data, total] = await db.$transaction([
      db.propertyResources.findMany({
        where: {
          propertyId,
        },
        select: {
          resourcesImage: true,
        },
        skip,
        take: limit,
      }),

      db.propertyResources.count({
        where: {
          propertyId,
        },
      }),
    ]);

    return {
      data: data.map((data) => data.resourcesImage),
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
    economicPropertyInfo: CreateEconomicPropertyInfoType,
    structurePropertyInfo: CreateStructurePropertyInfo,
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

        economicPropertyInformation: {
          create: {
            currency: economicPropertyInfo.currency,
            depositAmount: economicPropertyInfo.depositAmount,
            monthlyRent: economicPropertyInfo.monthlyRent,
            utilitiesIncluded: economicPropertyInfo.utilitiesIncluded,
          },
        },

        propertyStructureDescription: {
          create: {
            area: structurePropertyInfo.area,
            bathrooms: structurePropertyInfo.bathrooms,
            bedrooms: structurePropertyInfo.bathrooms,
            floors: structurePropertyInfo.floors,
            lotArea: structurePropertyInfo.lotArea,
            parkingSpaces: structurePropertyInfo.parkingSpaces,
            constructionYear: structurePropertyInfo.constructionYear,
          },
        },
      },
    });
  }

  //update functions
  async updateProperty(
    id: string,
    data: Prisma.PropertyUpdateInput,
    db: Prisma.TransactionClient = this.prisma,
  ) {
    return await db.property.update({
      where: {
        id,
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

  async saveAssetsResourcesByPropertyId(
    propertyId: string,
    resources: ResourceImageType[],
    db: Prisma.TransactionClient = this.prisma,
  ) {
    const createdResources = await Promise.all(
      resources.map((resource) =>
        db.resourceImages.create({
          data: {
            assetId: resource.assetId,
            url: resource.url,
            width: resource.width,
            height: resource.height,
            format: resource.format,
            secureUrl: resource.secureUrl,
          },
        }),
      ),
    );

    await db.propertyResources.createMany({
      data: createdResources.map((resource) => ({
        propertyId,
        resourceId: resource.id,
      })),
    });
  }
}
