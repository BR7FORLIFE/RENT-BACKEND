import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service.js';
import type { NotificationType } from '../global/global.schema.js';
import type { Prisma } from '../../../generated/prisma/client.js';

@Injectable()
export class NotificationRepository {
  constructor(private readonly prisma: PrismaService) {}

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
    limit: number,
    db: Prisma.TransactionClient = this.prisma,
  ) {
    return await db.notifications.findMany({
      where:
        type === 'RECEIVER'
          ? { receiverId: userId }
          : { transmitterId: userId },
      orderBy: { createAt: 'desc' },
      take: limit,
    });
  }

  async countUnread(
    userId: string,
    db: Prisma.TransactionClient = this.prisma,
  ) {
    return await db.notifications.count({
      where: { receiverId: userId, readAt: null },
    });
  }

  async markAsRead(
    userId: string,
    ids?: string[],
    db: Prisma.TransactionClient = this.prisma,
  ) {
    const { count } = await db.notifications.updateMany({
      where: {
        receiverId: userId,
        readAt: null,
        ...(ids ? { id: { in: ids } } : {}),
      },
      data: { readAt: new Date() },
    });

    return count;
  }
}
