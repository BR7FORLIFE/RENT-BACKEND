import { Injectable, Logger } from '@nestjs/common';
import { NotificationService } from '../../notifications/notification.service.js';
import { NotificationGateway } from '../../notifications/notification.gateway.js';
import type { NotificationTypeEnumType } from '../../global/global.schema.js';

// Envia notificaciones del modulo de servicios usando el sistema existente (persistencia +
// WebSocket). Se invoca SIEMPRE despues del commit y nunca propaga errores: una notificacion
// fallida no debe deshacer ni invalidar la operacion principal.
@Injectable()
export class ServiceNotifier {
  private readonly logger = new Logger(ServiceNotifier.name);

  constructor(
    private readonly notificationService: NotificationService,
    private readonly notificationGateway: NotificationGateway,
  ) {}

  async notify(
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
            'SERVICE_REQUEST_SERVICE',
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
