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
import { ServiceCatalogService } from './services/service-catalog.service.js';
import {
  changeServiceStatusDtoRequest,
  createServiceDtoRequest,
  listServicesQuery,
  updateServiceDtoRequest,
  type ChangeServiceStatusType,
  type CreateServiceType,
  type ListServicesQueryType,
  type UpdateServiceType,
} from './dtos/request-dto.js';

@UseGuards(JwtAuthGuard)
@Controller({ path: 'services' })
export class ServiceCatalogController {
  constructor(private readonly service: ServiceCatalogService) {}

  @Get()
  async findAll(
    @Req() req: AuthRequest,
    @Query(new ZodValidation(listServicesQuery)) query: ListServicesQueryType,
  ) {
    return await this.service.findAll(req.user, query);
  }

  @Get(':id')
  async findById(
    @Req() req: AuthRequest,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return await this.service.findById(req.user, id);
  }

  @Post()
  async create(
    @Req() req: AuthRequest,
    @Body(new ZodValidation(createServiceDtoRequest)) body: CreateServiceType,
  ) {
    return await this.service.create(req.user, body);
  }

  @Patch(':id')
  async update(
    @Req() req: AuthRequest,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body(new ZodValidation(updateServiceDtoRequest)) body: UpdateServiceType,
  ) {
    return await this.service.update(req.user, id, body);
  }

  @Patch(':id/status')
  async changeStatus(
    @Req() req: AuthRequest,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body(new ZodValidation(changeServiceStatusDtoRequest))
    body: ChangeServiceStatusType,
  ) {
    return await this.service.changeStatus(req.user, id, body);
  }
}
