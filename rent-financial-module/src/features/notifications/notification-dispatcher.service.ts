import { Injectable, Logger } from '@nestjs/common';
import { NotificationService } from './notification.service.js';
import { NotificationGateway } from './notification.gateway.js';
import type {
  NotificationSource,
  NotificationTypeEnumType,
} from '../global/global.schema.js';

// Envia notificaciones (persistencia + WebSocket) a varios usuarios. Se debe invocar
// SIEMPRE despues del commit y nunca propaga errores: una notificacion fallida no debe
// deshacer ni invalidar la operacion principal. Los ids son userId, no propertyMemberId.
@Injectable()
export class NotificationDispatcher {
  private readonly logger = new Logger(NotificationDispatcher.name);

  constructor(
    private readonly notificationService: NotificationService,
    private readonly notificationGateway: NotificationGateway,
  ) {}

  async notify(
    source: NotificationSource,
    transmitterId: string,
    receiverIds: string[],
    name: string,
    content: string,
    type: NotificationTypeEnumType = 'INFO',
  ): Promise<void> {
    const receivers = [...new Set(receiverIds)].filter(
      (id) => id !== transmitterId,
    );

    await Promise.all(
      receivers.map(async (receiverId) => {
        try {
          const notification = await this.notificationService.sendNotification(
            transmitterId,
            receiverId,
            content,
            name,
            source,
            type,
          );
          this.notificationGateway.sendNotification(receiverId, notification);
        } catch (error) {
          this.logger.warn(
            `No se pudo notificar al usuario ${receiverId}: ${(error as Error).message}`,
          );
        }
      }),
    );
  }
}
