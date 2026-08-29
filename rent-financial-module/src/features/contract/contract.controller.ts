import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
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
import {
  paginationSchema,
  type PaginationType,
} from '../../shared/pagination/pagination-schemas.js';

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

  @Get(':contractId/property/:propertyId')
  async findContractById(
    @Req() req: AuthRequest,
    @Param('contractId') contractId: string,
    @Param('propertyId') propertyId: string,
  ) {
    const data = this.service.getContractbyId(
      req.user.userId,
      propertyId,
      contractId,
    );
    return data;
  }

  @Get(':propertyId')
  async findAllContractByPropertyId(
    @Req() req: AuthRequest,
    @Param('propertyId') propertyId: string,
    @Query(new ZodValidation(paginationSchema)) paginationDto: PaginationType,
  ) {
    return await this.service.getAllContracts(
      req.user.userId,
      propertyId,
      paginationDto,
    );
  }
}
