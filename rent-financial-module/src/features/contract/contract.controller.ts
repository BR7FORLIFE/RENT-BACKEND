import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
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
  AcceptedOrRejectedContractDtoRequest,
  changeContractStatusDtoRequest,
  createContractDtoRequest,
  generateContractDraftDtoRequest,
  LoadDocumentInContractDtoRequest,
  type AcceptedOrRejectedContractType,
  type changeContractStatusType,
  type CreateContractType,
  type GenerateContractDraftType,
  type LoadDocumentInContractType,
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

  @Get('property/:propertyId')
  async findAllContractByPropertyId(
    @Req() req: AuthRequest,
    @Param('propertyId') propertyId: string,
    @Query(new ZodValidation(paginationSchema))
    paginationDto: PaginationType,
  ) {
    return await this.service.getAllContracts(
      req.user.userId,
      propertyId,
      paginationDto,
    );
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

  @Post('acceptedOrRejected')
  async AcceptedOrRejectedContractByTenantId(
    @Req() req: AuthRequest,
    @Body(new ZodValidation(AcceptedOrRejectedContractDtoRequest))
    body: AcceptedOrRejectedContractType,
  ) {
    return await this.service.AcceptedOrRejectedContractByTenant(
      body.contractId,
      body.propertyId,
      req.user.userId,
      body.status,
    );
  }

  @Post('draft')
  async generateContractDraft(
    @Req() req: AuthRequest,
    @Body(new ZodValidation(generateContractDraftDtoRequest))
    body: GenerateContractDraftType,
  ) {
    return await this.service.generateContractDraft(req.user.userId, body);
  }

  @Get('draft/property/:propertyId/getall')
  async findAllContractDraft(
    @Req() req: AuthRequest,
    @Param('propertyId') propertyId: string,
    @Query(new ZodValidation(paginationSchema))
    paginationDto: PaginationType,
  ) {
    return await this.service.getAllContractDraft(
      req.user.userId,
      propertyId,
      paginationDto,
    );
  }

  @Get('draft/:contractDraftId/property/:propertyId')
  async findContractDraftById(
    @Req() req: AuthRequest,
    @Param('contractDraftId') contractDraftId: string,
    @Param('propertyId') propertyId: string,
  ) {
    return await this.service.getContractDraftById(
      req.user.userId,
      contractDraftId,
      propertyId,
    );
  }

  @Post(':contractId/documents')
  async loadContractDocuments(
    @Param('contractId') contractId: string,
    @Req() req: AuthRequest,
    @Body(new ZodValidation(LoadDocumentInContractDtoRequest))
    body: LoadDocumentInContractType,
  ) {
    return await this.service.loadContractDocumentation(
      req.user.userId,
      body.propertyId,
      contractId,
      body.resources,
    );
  }

  @Patch(':contractId/property/:propertyId/status')
  async handleChangeContractStatus(
    @Req() req: AuthRequest,
    @Param('contractId') contractId: string,
    @Param('propertyId') propertyId: string,
    @Body(new ZodValidation(changeContractStatusDtoRequest))
    body: changeContractStatusType,
  ) {
    return await this.service.handleContractStatus(
      req.user.userId,
      contractId,
      body,
      propertyId,
    );
  }
}
