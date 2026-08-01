import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service.js';
import type {
  ContractType,
  StatusContractType,
} from '../schemas/contract.schema.js';
import type { Prisma } from '../../../../generated/prisma/client.js';
import type { ResourceImageType } from '../../property-registration/schemas/property-registration.schema.js';

@Injectable()
export class ContractRepository {
  constructor(private readonly prisma: PrismaService) {}

  //finds
  // async findAllContractByPropertyId(
  //   propertyId: string,
  //   paginationDto: PaginationType,
  //   db: Prisma.TransactionClient = this.prisma,
  // ): Promise<PaginationResponse<ContractInfoResponse>> {
  //   const { limit, page } = paginationDto;
  //   const skip = (paginationDto.page - 1) * paginationDto.limit;

  //   const [data, total] = await db.$transaction([
  //     db.contract.findMany({
  //       where: { propertyId },
  //       skip,
  //       take: limit,
  //     }),
  //     db.contract.count({ where: { propertyId } }),
  //   ]);

  //   return {
  //     data,
  //     metadata: {
  //       limit: limit,
  //       page,
  //       hasNextPage: page * limit < total,
  //       hasPreviousPage: page > 1,
  //       total,
  //       totalPages: Math.ceil(total / limit),
  //     },
  //   };
  // }

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

  async findContractById(propertyMemberId: string, contractId: string) {
    return await this.prisma.contract.findFirst({
      where: {
        id: contractId,
        OR: [
          { landlordMemberId: propertyMemberId },
          { tenantMemberId: propertyMemberId },
        ],
      },
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
}
