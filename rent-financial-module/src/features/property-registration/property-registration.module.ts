import { Module } from '@nestjs/common';
import { PropertyRegistrationController } from './property-registration.controller.js';
import { PropertyService } from './services/property.service.js';
import { PropertyRepository } from './repository/property.repository.js';
import { PrismaService } from '../../core/database/prisma.service.js';

@Module({
  controllers: [PropertyRegistrationController],
  providers: [PropertyService, PropertyRepository, PrismaService],
})
export class PropertyRegistrationModule {}
