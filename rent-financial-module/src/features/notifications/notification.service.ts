import { Injectable } from '@nestjs/common';
import { NotificationRepository } from './notification.repository.js';
import type {
  NotificationSource,
  NotificationType,
  NotificationTypeEnumType,
} from '../global/global.schema.js';

const NOTIFICATIONS_LIMIT = 50;

export type NotificationRecord = Awaited<
  ReturnType<NotificationRepository['saveNotification']>
>;

export interface NotificationItem {
  id: string;
  transmitterId: string;
  receiverId: string;
  source: string;
  name: string;
  content: string;
  typeNotification: NotificationTypeEnumType;
  readAt: Date | null;
  createdAt: Date;
}

export interface NotificationResponse {
  transmitter: NotificationItem[];
  receiver: NotificationItem[];
  unreadCount: number;
}

const toItem = (notification: NotificationRecord): NotificationItem => ({
  id: notification.id,
  transmitterId: notification.transmitterId,
  receiverId: notification.receiverId,
  source: notification.source,
  name: notification.name,
  content: notification.content,
  typeNotification: notification.type,
  readAt: notification.readAt,
  createdAt: notification.createAt,
});

@Injectable()
export class NotificationService {
  constructor(
    private readonly notificationRepository: NotificationRepository,
  ) {}

  async sendNotification(
    transmitterId: string,
    receiverId: string,
    content: string,
    name: string,
    source: NotificationSource,
    type: NotificationTypeEnumType,
  ): Promise<NotificationRecord> {
    const notification: NotificationType = {
      transmitterId,
      receiverId,
      content,
      name,
      source,
      type,
    };

    return await this.notificationRepository.saveNotification(notification);
  }

  toItem(notification: NotificationRecord): NotificationItem {
    return toItem(notification);
  }

  async getAllNotifications(userId: string): Promise<NotificationResponse> {
    const [transmitter, receiver, unreadCount] = await Promise.all([
      this.notificationRepository.findAllNotifications(
        userId,
        'TRANSMITTER',
        NOTIFICATIONS_LIMIT,
      ),
      this.notificationRepository.findAllNotifications(
        userId,
        'RECEIVER',
        NOTIFICATIONS_LIMIT,
      ),
      this.notificationRepository.countUnread(userId),
    ]);

    return {
      receiver: receiver.map(toItem),
      transmitter: transmitter.map(toItem),
      unreadCount,
    };
  }

  async markAsRead(userId: string, ids?: string[]) {
    await this.notificationRepository.markAsRead(userId, ids);

    return {
      unreadCount: await this.notificationRepository.countUnread(userId),
    };
  }
}
