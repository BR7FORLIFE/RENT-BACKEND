import { Injectable } from '@nestjs/common';
import { NotificationRepository } from './notification.repository.js';
import type {
  NotificationSource,
  NotificationType,
  NotificationTypeEnumType,
} from '../global/global.schema.js';
import { PrismaService } from '../../core/database/prisma.service.js';

interface ContentNotification {
  name: string;
  content: string;
  typeNotification: NotificationTypeEnumType;
}

interface NotificationResponse {
  transmitter: ContentNotification[];
  receiver: ContentNotification[];
}

@Injectable()
export class NotificationService {
  constructor(
    private readonly prismaClient: PrismaService,
    private readonly notificationRepository: NotificationRepository,
  ) {}

  async sendNotification(
    transmitterId: string,
    receiverId: string,
    content: string,
    name: string,
    source: NotificationSource,
    type: NotificationTypeEnumType,
  ) {
    const notification: NotificationType = {
      transmitterId,
      receiverId,
      content,
      name,
      source,
      type,
    };

    await this.notificationRepository.saveNotification(notification); //guardamos la notificacion

    //y enviamos el evento en el canal websockets del cliente
  }

  //propertyMember para obtener todas las notificaciones recibidas
  async getAllNotifications(userId: string): Promise<NotificationResponse> {
    const data = await this.prismaClient.$transaction(async (tx) => {
      const transmitter =
        await this.notificationRepository.findAllNotifications(
          userId,
          'TRANSMITTER',
          tx,
        );

      const receiver = await this.notificationRepository.findAllNotifications(
        userId,
        'RECEIVER',
        tx,
      );

      return { transmitter, receiver };
    });

    return {
      receiver: data.receiver.map(({ name, content, type }) => ({
        name,
        content,
        typeNotification: type,
      })),
      transmitter: data.transmitter.map(({ name, content, type }) => ({
        name,
        content,
        typeNotification: type,
      })),
    };
  }
}
