import { Module } from '@nestjs/common';
import { PropertyRegistrationController } from './property-registration.controller.js';
import { PropertyService } from './services/property.service.js';
import { PropertyRepository } from './repository/property.repository.js';
import { PropertyHelper } from './services/helpers.service.js';
import { PrismaModule } from '../../core/database/prisma.module.js';
import { GlobalModule } from '../global/global.module.js';
import { propertyPublicController } from './property-public.controller.js';

@Module({
  controllers: [PropertyRegistrationController, propertyPublicController],
  providers: [PropertyService, PropertyRepository, PropertyHelper],
  exports: [PropertyRepository, PropertyHelper],
  imports: [PrismaModule, GlobalModule],
})
export class PropertyRegistrationModule {}
