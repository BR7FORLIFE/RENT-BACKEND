import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../core/auth/auth.guard.js';
import { ZodValidation } from '../../core/pipes/zod-validation.pipe.js';
import type { AuthRequest } from '../../types/global-types.js';
import { ServiceRequestService } from './services/service-request.service.js';
import {
  createServiceRequestDtoRequest,
  listServiceRequestsQuery,
  proposePriceDtoRequest,
  serviceRequestActionDtoRequest,
  type CreateServiceRequestType,
  type ListServiceRequestsQueryType,
  type ProposePriceType,
  type ServiceRequestActionType,
} from './dtos/request-dto.js';

const uuid = () => new ParseUUIDPipe();

@UseGuards(JwtAuthGuard)
@Controller({ path: 'service-requests' })
export class ServiceRequestController {
  constructor(private readonly service: ServiceRequestService) {}

  @Post()
  async create(
    @Req() req: AuthRequest,
    @Body(new ZodValidation(createServiceRequestDtoRequest))
    body: CreateServiceRequestType,
  ) {
    return await this.service.create(req.user, body);
  }

  @Get()
  async findAccessible(
    @Req() req: AuthRequest,
    @Query(new ZodValidation(listServiceRequestsQuery))
    query: ListServiceRequestsQueryType,
  ) {
    return await this.service.findAccessible(req.user, query);
  }

  // rutas fijas antes de ':id'
  @Get('mine')
  async findMine(
    @Req() req: AuthRequest,
    @Query(new ZodValidation(listServiceRequestsQuery))
    query: ListServiceRequestsQueryType,
  ) {
    return await this.service.findMine(req.user, query);
  }

  @Get('provider/mine')
  async findReceived(
    @Req() req: AuthRequest,
    @Query(new ZodValidation(listServiceRequestsQuery))
    query: ListServiceRequestsQueryType,
  ) {
    return await this.service.findReceived(req.user, query);
  }

  @Get('property/:propertyId')
  async findByProperty(
    @Req() req: AuthRequest,
    @Param('propertyId', uuid()) propertyId: string,
    @Query(new ZodValidation(listServiceRequestsQuery))
    query: ListServiceRequestsQueryType,
  ) {
    return await this.service.findByProperty(req.user, propertyId, query);
  }

  @Get(':id')
  async findById(@Req() req: AuthRequest, @Param('id', uuid()) id: string) {
    return await this.service.findById(req.user, id);
  }

  @Post(':id/accept')
  @HttpCode(200)
  async accept(
    @Req() req: AuthRequest,
    @Param('id', uuid()) id: string,
    @Body(new ZodValidation(serviceRequestActionDtoRequest))
    body: ServiceRequestActionType,
  ) {
    return await this.service.accept(req.user, id, body);
  }

  @Post(':id/reject')
  @HttpCode(200)
  async reject(
    @Req() req: AuthRequest,
    @Param('id', uuid()) id: string,
    @Body(new ZodValidation(serviceRequestActionDtoRequest))
    body: ServiceRequestActionType,
  ) {
    return await this.service.reject(req.user, id, body);
  }

  @Post(':id/start')
  @HttpCode(200)
  async start(
    @Req() req: AuthRequest,
    @Param('id', uuid()) id: string,
    @Body(new ZodValidation(serviceRequestActionDtoRequest))
    body: ServiceRequestActionType,
  ) {
    return await this.service.start(req.user, id, body);
  }

  @Post(':id/complete')
  @HttpCode(200)
  async complete(
    @Req() req: AuthRequest,
    @Param('id', uuid()) id: string,
    @Body(new ZodValidation(serviceRequestActionDtoRequest))
    body: ServiceRequestActionType,
  ) {
    return await this.service.complete(req.user, id, body);
  }

  @Post(':id/cancel')
  @HttpCode(200)
  async cancel(
    @Req() req: AuthRequest,
    @Param('id', uuid()) id: string,
    @Body(new ZodValidation(serviceRequestActionDtoRequest))
    body: ServiceRequestActionType,
  ) {
    return await this.service.cancel(req.user, id, body);
  }

  @Post(':id/price/propose')
  @HttpCode(200)
  async proposePrice(
    @Req() req: AuthRequest,
    @Param('id', uuid()) id: string,
    @Body(new ZodValidation(proposePriceDtoRequest)) body: ProposePriceType,
  ) {
    return await this.service.proposePrice(req.user, id, body);
  }

  @Post(':id/price/accept')
  @HttpCode(200)
  async acceptPrice(@Req() req: AuthRequest, @Param('id', uuid()) id: string) {
    return await this.service.acceptPrice(req.user, id);
  }
}
