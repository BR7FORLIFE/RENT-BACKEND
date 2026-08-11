import { Module } from '@nestjs/common';
import { PropertyRegistrationController } from './property-registration.controller.js';
import { PropertyService } from './services/property.service.js';
import { PropertyRepository } from './repository/property.repository.js';
import { PropertyHelper } from './services/helpers.service.js';
import { PrismaModule } from '../../core/database/prisma.module.js';
import { GlobalModule } from '../global/global.module.js';
import { propertyPublicController } from './property-public.controller.js';
import { PropertyMemberController } from './property-member.controller.js';
import { PropertyMemberService } from './services/property-member.service.js';
import { PropertyMemberRepository } from './repository/property-member.repository.js';
import { PropertyServiceMapper } from './repository/mappers/property-mapper.service.js';

@Module({
  controllers: [
    PropertyRegistrationController,
    propertyPublicController,
    PropertyMemberController,
  ],
  providers: [
    PropertyService,
    PropertyRepository,
    PropertyHelper,
    PropertyMemberService,
    PropertyMemberRepository,
    PropertyServiceMapper,
  ],
  exports: [PropertyRepository, PropertyHelper, PropertyMemberRepository],
  imports: [PrismaModule, GlobalModule],
})
export class PropertyRegistrationModule {}
