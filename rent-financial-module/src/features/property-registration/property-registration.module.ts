import { Module } from '@nestjs/common';
import { PropertyRegistrationController } from './property-registration.controller.js';
import { PropertyService } from './services/property.service.js';
import { PropertyRepository } from './repository/property.repository.js';
import { PropertyHelper } from './services/helpers.service.js';
import { PrismaModule } from '../../core/database/prisma.module.js';
import { GlobalModule } from '../global/global.module.js';

@Module({
  controllers: [PropertyRegistrationController],
  providers: [PropertyService, PropertyRepository, PropertyHelper],
  exports: [PropertyRepository],
  imports: [PrismaModule, GlobalModule],
})
export class PropertyRegistrationModule {}
