import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Query,
  Req,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../core/auth/auth.guard.js';
import { ZodValidation } from '../../core/pipes/zod-validation.pipe.js';
import {
  createPropertySchema,
  type CreatePropertyType,
} from './schemas/property-registration.schema.js';
import { PropertyService } from './services/property.service.js';
import type { AuthRequest } from '../../types/auth-request.js';
import {
  paginationSchema,
  type PaginationType,
} from '../../shared/pagination/pagination-schemas.js';

@UseGuards(JwtAuthGuard)
@Controller({
  path: 'property',
})
export class PropertyRegistrationController {
  constructor(private readonly propertyService: PropertyService) {}

  @UsePipes(new ZodValidation(createPropertySchema))
  @HttpCode(201)
  @Post()
  async registerProperty(
    @Req() req: AuthRequest,
    @Body() propertyDto: CreatePropertyType,
  ) {
    const { id, message } = await this.propertyService.registerProperty(
      req.user.userId,
      propertyDto,
    );

    return {
      id,
      message,
    };
  }

  @Get()
  async consultAllProperties(
    @Req() req: AuthRequest,
    @Query(new ZodValidation(paginationSchema)) paginationDto: PaginationType,
  ) {
    const response = await this.propertyService.consultAllProperties(
      req.user.userId,
      paginationDto,
    );

    return response;
  }

  async consultPropertyByFmi() {}

  async modifyProperty() {}
  async deleteProperty() {}
}
