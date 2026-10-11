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
import { ServiceOfferingService } from './services/service-offering.service.js';
import {
  changeOfferingStatusDtoRequest,
  createOfferingDtoRequest,
  listOfferingsQuery,
  updateOfferingDtoRequest,
  type ChangeOfferingStatusType,
  type CreateOfferingType,
  type ListOfferingsQueryType,
  type UpdateOfferingType,
} from './dtos/request-dto.js';

@UseGuards(JwtAuthGuard)
@Controller({ path: 'service-offerings' })
export class ServiceOfferingController {
  constructor(private readonly service: ServiceOfferingService) {}

  @Get()
  async findAll(
    @Req() req: AuthRequest,
    @Query(new ZodValidation(listOfferingsQuery)) query: ListOfferingsQueryType,
  ) {
    return await this.service.findAll(req.user, query);
  }

  // debe declararse antes de ':id'
  @Get('mine')
  async findMine(
    @Req() req: AuthRequest,
    @Query(new ZodValidation(listOfferingsQuery)) query: ListOfferingsQueryType,
  ) {
    return await this.service.findMine(req.user, query);
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
    @Body(new ZodValidation(createOfferingDtoRequest)) body: CreateOfferingType,
  ) {
    return await this.service.create(req.user, body);
  }

  @Patch(':id')
  async update(
    @Req() req: AuthRequest,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body(new ZodValidation(updateOfferingDtoRequest)) body: UpdateOfferingType,
  ) {
    return await this.service.update(req.user, id, body);
  }

  @Patch(':id/status')
  async changeStatus(
    @Req() req: AuthRequest,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body(new ZodValidation(changeOfferingStatusDtoRequest))
    body: ChangeOfferingStatusType,
  ) {
    return await this.service.changeStatus(req.user, id, body);
  }
}
