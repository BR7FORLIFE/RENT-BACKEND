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
import type { AuthRequest } from '../../types/global-types.js';
import {
  paginationSchema,
  type PaginationType,
} from '../../shared/pagination/pagination-schemas.js';
import {
  ChangeOwnerDtoRequest,
  createPropertyDtoRequest,
  EditingPropertyDtoRequest,
  GetAISuggestion,
  type ChangeOwnerType,
  type CreatePropertyType,
  type EditingPropertyType,
} from './dtos/request-dto.js';
import { CreateSuggestionByPropertyField } from './services/helpers.service.js';
import type { PropertyField } from './types.js';

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

  //cambiar el dueño de la propiedad hacia otra persona manteniendo el registrador original
  @UsePipes(new ZodValidation(ChangeOwnerDtoRequest))
  @HttpCode(200)
  @Post()
  async changeOwnerProperty(
    @Req() req: AuthRequest,
    @Body() newOwner: ChangeOwnerType,
  ) {}

  @Delete()
  async deleteProperty() {}

  // IA suggestion
  @UsePipes(new ZodValidation(GetAISuggestion))
  @HttpCode(200)
  @Post('IA-registration-suggestion')
  async handleAISuggestion(@Body() propertyField: PropertyField) {
    const suggestion = await CreateSuggestionByPropertyField(propertyField);
    return suggestion;
  }
}
