import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service.js';
import type { NotificationType } from '../global/global.schema.js';
import type { Prisma } from '../../../generated/prisma/client.js';

@Injectable()
export class NotificationRepository {
  constructor(private readonly prisma: PrismaService) {}

  //notifications
  async saveNotification(
    data: NotificationType,
    db: Prisma.TransactionClient = this.prisma,
  ) {
    return await db.notifications.create({
      data,
    });
  }

  async findAllNotifications(
    userId: string,
    type: 'TRANSMITTER' | 'RECEIVER',
    db: Prisma.TransactionClient = this.prisma,
  ) {
    if (type === 'RECEIVER') {
      return await db.notifications.findMany({
        where: {
          receiverId: userId,
        },
      });
    }

    return await db.notifications.findMany({
      where: {
        transmitterId: userId,
      },
    });
  }
}
