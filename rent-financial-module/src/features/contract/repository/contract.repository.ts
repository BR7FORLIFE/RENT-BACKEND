import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service.js';
import type { ContractType } from '../schemas/contract.schema.js';

@Injectable()
export class ContractRepository {
  constructor(private readonly prisma: PrismaService) {}

  //saves
  async saveContract(contract: ContractType) {
    return await this.prisma.contract.create({ data: contract });
  }
}
