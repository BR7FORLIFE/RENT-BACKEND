import { Module } from '@nestjs/common';
import { PrismaModule } from '../../core/database/prisma.module.js';
import { SytemPropertyRoleModule } from '../system-property-role/system-property-role.module.js';
import { NotificationModule } from '../notifications/notification.module.js';
import { ServiceCatalogController } from './service-catalog.controller.js';
import { ServiceOfferingController } from './service-offering.controller.js';
import { ServiceRequestController } from './service-request.controller.js';
import { ServiceCatalogService } from './services/service-catalog.service.js';
import { ServiceOfferingService } from './services/service-offering.service.js';
import { ServiceRequestService } from './services/service-request.service.js';
import { ServiceNotifier } from './services/service-notifier.service.js';
import { ServiceCatalogRepository } from './repository/service-catalog.repository.js';
import { ServiceOfferingRepository } from './repository/service-offering.repository.js';
import { ServiceRequestRepository } from './repository/service-request.repository.js';

@Module({
  imports: [PrismaModule, SytemPropertyRoleModule, NotificationModule],
  controllers: [
    ServiceCatalogController,
    ServiceOfferingController,
    ServiceRequestController,
  ],
  providers: [
    ServiceCatalogService,
    ServiceOfferingService,
    ServiceRequestService,
    ServiceNotifier,
    ServiceCatalogRepository,
    ServiceOfferingRepository,
    ServiceRequestRepository,
  ],
})
export class PropertiesServicesModule {}
