import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../core/auth/auth.guard.js';
import { ZodValidation } from '../../core/pipes/zod-validation.pipe.js';
import { PropertyService } from './services/property.service.js';
import type { AuthRequest } from '../../types/auth-request.js';
import {
  paginationSchema,
  type PaginationType,
} from '../../shared/pagination/pagination-schemas.js';
import {
  createPropertyDtoRequest,
  EditingPropertyDtoRequest,
  type CreatePropertyType,
  type EditingPropertyType,
} from './dtos/request-dto.js';

@UseGuards(JwtAuthGuard)
@Controller({
  path: 'property',
})
export class PropertyRegistrationController {
  constructor(private readonly propertyService: PropertyService) {}

  @UsePipes(new ZodValidation(createPropertyDtoRequest))
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

  @Get(':id')
  async consultPropertyById(@Req() req: AuthRequest, @Param('id') id: string) {
    const data = await this.propertyService.consultPropertyById(
      req.user.userId,
      id,
    );

    return {
      property: data,
    };
  }

  @UsePipes(new ZodValidation(EditingPropertyDtoRequest))
  @HttpCode(201)
  @Patch()
  async modifyProperty(
    @Req() req: AuthRequest,
    @Body() editingProperty: EditingPropertyType,
  ) {
    const { id, message } = await this.propertyService.editingProperty(
      req.user.userId,
      editingProperty,
    );

    return {
      id,
      message,
    };
  }

  @Delete()
  async deleteProperty() {}
}
