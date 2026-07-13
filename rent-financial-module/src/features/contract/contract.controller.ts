import {
  Body,
  Controller,
  Post,
  Req,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../core/auth/auth.guard.js';
import { ContractService } from './services/contract.service.js';
import { ZodValidation } from '../../core/pipes/zod-validation.pipe.js';
import type { AuthRequest } from '../../types/global-types.js';
import {
  createContractDtoRequest,
  type CreateContractType,
} from './dtos/request-dto.js';

@UseGuards(JwtAuthGuard)
@Controller({
  path: 'contract',
})
export class ContractController {
  constructor(private readonly service: ContractService) {}

  @UsePipes(new ZodValidation(createContractDtoRequest))
  @Post()
  async createContract(
    @Req() req: AuthRequest,
    @Body() contractDto: CreateContractType,
  ) {
    const { id, message } = await this.service.createContract(
      req.user.userId,
      contractDto,
    );

    return {
      id,
      message,
    };
  }
}
