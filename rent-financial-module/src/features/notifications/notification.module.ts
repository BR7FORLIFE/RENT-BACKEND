import { Module } from '@nestjs/common';
import { PrismaModule } from '../../core/database/prisma.module.js';
import { NotificationService } from './notification.service.js';
import { NotificationRepository } from './notification.repository.js';
import { NotificationGateway } from './notification.gateway.js';

@Module({
  imports: [PrismaModule],
  providers: [NotificationService, NotificationRepository, NotificationGateway],
  controllers: [],
  exports: [NotificationGateway, NotificationService],
})
export class NotificationModule {}
