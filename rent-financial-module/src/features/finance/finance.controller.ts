import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../core/auth/auth.guard.js';
import { ZodValidation } from '../../core/pipes/zod-validation.pipe.js';
import type { AuthRequest } from '../../types/global-types.js';
import { FinanceService } from './services/finance.service.js';
import { FinanceAutomationService } from './services/finance-automation.service.js';
import {
  changeFinancialStatusDtoRequest,
  createFinancialTransactionDtoRequest,
  financialSummaryQuery,
  listFinancialTransactionsQuery,
  markAsPaidDtoRequest,
  updateFinancialTransactionDtoRequest,
  type ChangeFinancialStatusType,
  type CreateFinancialTransactionType,
  type FinancialSummaryQueryType,
  type ListFinancialTransactionsQueryType,
  type MarkAsPaidType,
  type UpdateFinancialTransactionType,
} from './dtos/request-dto.js';

const uuid = () => new ParseUUIDPipe();

@UseGuards(JwtAuthGuard)
@Controller({ path: 'finance/property/:propertyId' })
export class FinanceController {
  constructor(
    private readonly service: FinanceService,
    private readonly automation: FinanceAutomationService,
  ) {}

  // simula el cobro de los canones vencidos de la propiedad (tambien corre solo cada hora)
  @Post('simulate-rent')
  async simulateRent(
    @Req() req: AuthRequest,
    @Param('propertyId', uuid()) propertyId: string,
  ) {
    await this.service.assertCanRegister(req.user, propertyId);
    const created = await this.automation.generateDueRent(propertyId);
    return { created };
  }

  @Post('transactions')
  async create(
    @Req() req: AuthRequest,
    @Param('propertyId', uuid()) propertyId: string,
    @Body(new ZodValidation(createFinancialTransactionDtoRequest))
    body: CreateFinancialTransactionType,
  ) {
    return await this.service.create(req.user, propertyId, body);
  }

  @Get('transactions')
  async findAll(
    @Req() req: AuthRequest,
    @Param('propertyId', uuid()) propertyId: string,
    @Query(new ZodValidation(listFinancialTransactionsQuery))
    query: ListFinancialTransactionsQueryType,
  ) {
    return await this.service.findAll(req.user, propertyId, query);
  }

  @Get('history')
  async findHistory(
    @Req() req: AuthRequest,
    @Param('propertyId', uuid()) propertyId: string,
    @Query(new ZodValidation(listFinancialTransactionsQuery))
    query: ListFinancialTransactionsQueryType,
  ) {
    return await this.service.findHistory(req.user, propertyId, query);
  }

  @Get('summary')
  async getSummary(
    @Req() req: AuthRequest,
    @Param('propertyId', uuid()) propertyId: string,
    @Query(new ZodValidation(financialSummaryQuery))
    query: FinancialSummaryQueryType,
  ) {
    return await this.service.getSummary(req.user, propertyId, query);
  }

  @Get('transactions/:id')
  async findById(
    @Req() req: AuthRequest,
    @Param('propertyId', uuid()) propertyId: string,
    @Param('id', uuid()) id: string,
  ) {
    return await this.service.findById(req.user, propertyId, id);
  }

  @Patch('transactions/:id')
  async update(
    @Req() req: AuthRequest,
    @Param('propertyId', uuid()) propertyId: string,
    @Param('id', uuid()) id: string,
    @Body(new ZodValidation(updateFinancialTransactionDtoRequest))
    body: UpdateFinancialTransactionType,
  ) {
    return await this.service.update(req.user, propertyId, id, body);
  }

  @Patch('transactions/:id/status')
  async changeStatus(
    @Req() req: AuthRequest,
    @Param('propertyId', uuid()) propertyId: string,
    @Param('id', uuid()) id: string,
    @Body(new ZodValidation(changeFinancialStatusDtoRequest))
    body: ChangeFinancialStatusType,
  ) {
    return await this.service.changeStatus(req.user, propertyId, id, body);
  }

  @Post('transactions/:id/pay')
  async markAsPaid(
    @Req() req: AuthRequest,
    @Param('propertyId', uuid()) propertyId: string,
    @Param('id', uuid()) id: string,
    @Body(new ZodValidation(markAsPaidDtoRequest)) body: MarkAsPaidType,
  ) {
    return await this.service.markAsPaid(req.user, propertyId, id, body);
  }
}
