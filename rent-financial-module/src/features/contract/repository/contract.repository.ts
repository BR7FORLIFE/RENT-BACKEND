import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service.js';
import type {
  ContractType,
  StatusContractType,
} from '../schemas/contract.schema.js';
import type { Prisma } from '../../../../generated/prisma/client.js';
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

  //saves
  async saveContract(
    contract: ContractType,
    db: Prisma.TransactionClient = this.prisma,
  ) {
    return await db.contract.create({ data: contract });
  }
}
