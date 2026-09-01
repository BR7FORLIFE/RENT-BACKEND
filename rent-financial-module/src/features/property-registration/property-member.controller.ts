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
import type { AuthRequest } from '../../types/global-types.js';
import {
  getMembersQuerySchema,
  propertyMemberStatusFilter,
  type GetMembersQuery,
  type PropertyMemberStatusFilter,
} from './schemas/property-registration.schema.js';
import {
  paginationSchema,
  type PaginationType,
} from '../../shared/pagination/pagination-schemas.js';
import { ZodValidation } from '../../core/pipes/zod-validation.pipe.js';
import { PropertyMemberService } from './services/property-member.service.js';
import {
  assignmentRolesToMember,
  InvitePropertyMemberDtoRequest,
  type assignmentRolesToMemberType,
  type InvitePropertyMemberType,
} from './dtos/request-dto.js';

@UseGuards(JwtAuthGuard)
@Controller({
  path: 'property-member',
})
export class PropertyMemberController {
  constructor(private propertyMemberService: PropertyMemberService) {}

  @Get(':propertyId')
  async getAllPropertyMembersByPropertyId(
    @Req() req: AuthRequest,
    @Param('propertyId') propertyId: string,
    @Query(new ZodValidation(getMembersQuerySchema))
    queryStatus: GetMembersQuery,
    @Query(new ZodValidation(paginationSchema)) paginationDto: PaginationType,
  ) {
    return await this.propertyMemberService.getAllPropertyMemberByPropertyId(
      req.user.userId,
      propertyId,
      queryStatus.status,
      paginationDto,
    );
  }

  //invitaciones de property Members
  @UsePipes(new ZodValidation(InvitePropertyMemberDtoRequest))
  @Post('invite-property-member')
  async invitePropertyMembers(@Body() invitationReq: InvitePropertyMemberType) {
    const { id, invitedEmailTo, message } =
      await this.propertyMemberService.invitePropertyMembers(invitationReq);

    return { id, invitedEmailTo, message };
  }

  //controlador para asignar una lista de roles al usuario
  @Post(':propertyMemberId')
  async assignmentRolesToMember(
    @Req() req: AuthRequest,
    @Param('propertyMemberId') propertyMemberId: string,
    @Body(new ZodValidation(assignmentRolesToMember))
    body: assignmentRolesToMemberType,
  ) {
    return await this.propertyMemberService.assignmentRolesToMember(
      req.user.userId,
      propertyMemberId,
      body.propertyId,
      body.roles,
    );
  }

  //estos endpoint son importantes ya que sin importar si el miembro
  // este activo o en proceso pues puede obtener informacion de aquellas
  //propiedades donde es parte o pretende ser parte, ya que gracias al sistema
  // de politicas de RENT los mimebros podrán hacer ciertas acciones dentro de
  // la app
  @Get('properties')
  async getAllPropertiesByPropertyMember(
    @Req() req: AuthRequest,
    @Query(new ZodValidation(propertyMemberStatusFilter))
    filter: PropertyMemberStatusFilter,
    @Query(new ZodValidation(paginationSchema))
    paginationDto: PaginationType,
  ) {
    return await this.propertyMemberService.getAllPropertiesByPropertyMemberId(
      req.user.userId,
      filter,
      paginationDto,
    );
  }

  @Get('properties/:propertyId')
  async getPropertyByPropertyMember(
    @Req() req: AuthRequest,
    @Param('propertyId') propertyId: string,
  ) {
    return await this.propertyMemberService.getPropertyByPropertyMemberId(
      req.user.userId,
      propertyId,
    );
  }

  @Get(':propertyId/me')
  async propertyMemberMe(
    @Req() req: AuthRequest,
    @Param('propertyId') propertyId: string,
  ) {
    return this.propertyMemberService.propertyMemberMe(
      propertyId,
      req.user.userId,
    );
  }
}
