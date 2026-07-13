import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service.js';
import type {
  ContractType,
  StatusContractType,
} from '../schemas/contract.schema.js';

@Injectable()
export class ContractRepository {
  constructor(private readonly prisma: PrismaService) {}

  //finds
  async findContractByStatusContractAndPropertyId(
    statusContract: StatusContractType,
    propertyId: string,
  ) {
    return await this.prisma.contract.findFirst({
      where: {
        propertyId,
        status: statusContract,
      },
    });
  }

  //saves
  async saveContract(contract: ContractType) {
    return await this.prisma.contract.create({ data: contract });
  }
}
