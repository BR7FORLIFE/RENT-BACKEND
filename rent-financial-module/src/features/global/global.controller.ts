import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import type { AuthRequest } from '../../types/global-types.js';
import { ZodValidation } from '../../core/pipes/zod-validation.pipe.js';
import {
  NotificationQueryParamsSchema,
  type NotificationQueryParamsType,
} from './global.schema.js';
import { JwtAuthGuard } from '../../core/auth/auth.guard.js';

@UseGuards(JwtAuthGuard)
@Controller({
  path: 'global',
})
export class GlobalController {
  constructor() {}

  @Get('notifications')
  async getNotifications(
    @Req() req: AuthRequest,
    @Param(new ZodValidation(NotificationQueryParamsSchema))
    filter: NotificationQueryParamsType,
  ) {}
}
