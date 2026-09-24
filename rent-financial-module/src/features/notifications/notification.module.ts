import { Module } from '@nestjs/common';
import { PrismaModule } from '../../core/database/prisma.module.js';
import { NotificationService } from './notification.service.js';
import { NotificationRepository } from './notification.repository.js';
import { NotificationGateway } from './notification.gateway.js';

@Module({
  imports: [PrismaModule],
  providers: [NotificationGateway, NotificationService, NotificationRepository],
  controllers: [],
  exports: [NotificationService],
})
export class NotificationModule {}
