import { Module } from '@nestjs/common';
import { PrismaModule } from '../../core/database/prisma.module.js';
import { NotificationService } from './notification.service.js';
import { NotificationRepository } from './notification.repository.js';
import { NotificationGateway } from './notification.gateway.js';
import { NotificationDispatcher } from './notification-dispatcher.service.js';

@Module({
  imports: [PrismaModule],
  providers: [
    NotificationService,
    NotificationRepository,
    NotificationGateway,
    NotificationDispatcher,
  ],
  controllers: [],
  exports: [NotificationGateway, NotificationService, NotificationDispatcher],
})
export class NotificationModule {}
