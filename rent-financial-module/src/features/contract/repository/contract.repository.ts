import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service.js';
import type {
  ContractType,
  StatusContractType,
} from '../schemas/contract.schema.js';
import type { Prisma } from '../../../../generated/prisma/client.js';
import type { ResourceImageType } from '../../global/global.schema.js';
import type {
  PaginationResponse,
  PaginationType,
} from '../../../shared/pagination/pagination-schemas.js';
import type { ContractInfoResponse } from '../dtos/response-dto.js';

@Injectable()
export class ContractRepository {
  constructor(private readonly prisma: PrismaService) {}

  //finds
  async findAllContractByPropertyId(
    propertyId: string,
    paginationDto: PaginationType,
    db: Prisma.TransactionClient = this.prisma,
  ): Promise<PaginationResponse<ContractInfoResponse>> {
    const { limit, page } = paginationDto;
    const skip = (paginationDto.page - 1) * paginationDto.limit;

    const [data, total] = await db.$transaction([
      db.contract.findMany({
        where: { propertyId },
        skip,
        take: limit,
      }),
      db.contract.count({ where: { propertyId } }),
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

  async findContractByStatusContractAndPropertyId(
    statusContract: StatusContractType,
    propertyId: string,
    db: Prisma.TransactionClient = this.prisma,
  ) {
    return await db.contract.findFirst({
      where: {
        propertyId,
        status: statusContract,
      },
    });
  }

  async findContractByIdAndPropertyId(
    propertyId: string,
    contractId: string,
    db: Prisma.TransactionClient = this.prisma,
  ) {
    return await db.contract.findFirst({
      where: {
        id: contractId,
        propertyId,
      },
    });
  }

  async findContractByIdAndTenantMemberId(
    contractId: string,
    tenantMemberId: string,
    db: Prisma.TransactionClient = this.prisma,
  ) {
    return await db.contract.findFirst({
      where: { id: contractId, tenantMemberId },
    });
  }

  //saves
  async saveContract(
    contract: ContractType,
    resourcesImages: ResourceImageType[],
    db: Prisma.TransactionClient = this.prisma,
  ) {
    return await db.contract.create({
      data: {
        ...contract,
        contractResources: {
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

  async saveContractResourcesByContractId(
    contractId: string,
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

    await db.contractResources.createMany({
      data: createdResources.map((resource) => ({
        contractId,
        resourceId: resource.id,
      })),
    });
  }

  //updates
  async updateStatusContract(
    contractId: string,
    tenantMemberId: string,
    status: StatusContractType,
    db: Prisma.TransactionClient = this.prisma,
  ) {
    await db.contract.update({
      where: {
        id: contractId,
        tenantMemberId,
      },
      data: {
        status,
      },
    });
  }
}
