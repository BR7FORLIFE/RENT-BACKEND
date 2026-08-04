import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../core/auth/auth.guard.js';
import type { AuthRequest } from '../../types/global-types.js';
import {
  getMembersQuerySchema,
  type GetMembersQuery,
} from './schemas/property-registration.schema.js';
import {
  paginationSchema,
  type PaginationType,
} from '../../shared/pagination/pagination-schemas.js';
import { ZodValidation } from '../../core/pipes/zod-validation.pipe.js';
import { PropertyMemberService } from './services/property-member.service.js';

@UseGuards(JwtAuthGuard)
@Controller({
  path: 'property-member',
})
export class PropertyMemberController {
  constructor(private propertyMemberService: PropertyMemberService) {}

  @Get()
  async getAllPropertyMembersByPropertyId(
    @Req() req: AuthRequest,
    @Param() propertyId: string,
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
}
