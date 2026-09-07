import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service.js';
import type {
  ContractDraftType,
  ContractType,
  StatusContractType,
} from '../schemas/contract.schema.js';
import type { Prisma } from '../../../../generated/prisma/client.js';
import type { ResourceImageType } from '../../global/global.schema.js';
import type {
  PaginationResponse,
  PaginationType,
} from '../../../shared/pagination/pagination-schemas.js';
import type {
  ContractDraftInfoResponse,
  ContractInfoResponse,
} from '../dtos/response-dto.js';

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

  async findAllContractDraftByPropertyId(
    propertyId: string,
    paginationDto: PaginationType,
    db: Prisma.TransactionClient = this.prisma,
  ): Promise<PaginationResponse<ContractDraftInfoResponse>> {
    const { limit, page } = paginationDto;
    const skip = (paginationDto.page - 1) * paginationDto.limit;

    const [data, total] = await db.$transaction([
      db.contractDraft.findMany({
        where: { propertyId },
        skip,
        take: limit,
      }),
      db.contractDraft.count({ where: { propertyId } }),
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

  async findContractDraftByIdAndPropertyId(
    contractDraftId: string,
    propertyId: string,
    db: Prisma.TransactionClient = this.prisma,
  ) {
    return await db.contractDraft.findFirst({
      where: { id: contractDraftId, propertyId },
    });
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
    contractId: string,
    propertyId: string,
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

  //encontrar la ultima version del borrador de contratp
  async findLastVersionInContractDraft(
    propertyId: string,
    db: Prisma.TransactionClient = this.prisma,
  ) {
    const lastContractDraft = await db.contractDraft.findFirst({
      where: {
        propertyId,
      },
      orderBy: {
        version: 'desc',
      },
      select: {
        version: true,
      },
    });
    const version = (lastContractDraft?.version ?? 0) + 1;

    return version;
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

  async saveContractDraft(
    data: ContractDraftType,
    db: Prisma.TransactionClient = this.prisma,
  ) {
    return await db.contractDraft.create({
      data,
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
  async updateStatusContractByTenantId(
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

  async updateStatusContractById(
    contractId: string,
    status: StatusContractType,
    db: Prisma.TransactionClient = this.prisma,
  ) {
    await db.contract.update({
      where: {
        id: contractId,
      },
      data: {
        status,
      },
    });
  }
}
