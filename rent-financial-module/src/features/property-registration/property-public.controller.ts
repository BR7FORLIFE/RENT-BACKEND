import { Controller, Get, HttpCode, Query } from '@nestjs/common';
import { PropertyService } from './services/property.service.js';

@Controller({
  path: 'property-process-public',
})
export class propertyPublicController {
  constructor(private readonly propertyService: PropertyService) {}

  @HttpCode(200)
  @Get('accept-invitation')
  async acceptPropertyMemberInvitation(@Query('token') token?: string) {
    if (!token) {
      return {
        message:
          'Necesitas insertar el token de la invitación o, por el contrario, la solicitud no es válida',
      };
    }

    const { message } =
      await this.propertyService.acceptPropertyMemberInvitation(token);

    return { message };
  }
}
