import { UseGuards } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';

import { Server } from 'socket.io';
import { z } from 'zod';
import { WsJwtGuard } from '../../core/auth/ws.guard.js';
import type { AuthenticatedSocket } from '../../types/global-types.js';
import {
  NotificationService,
  type NotificationRecord,
} from './notification.service.js';

const MarkAsReadSchema = z.object({
  ids: z.array(z.uuid()).min(1).max(100),
});

@WebSocketGateway({
  namespace: 'notifications',
  cors: {
    origin: '*',
  },
})
export class NotificationGateway {
  constructor(private readonly notificationService: NotificationService) {}

  @WebSocketServer()
  server: Server;

  private authenticatedUser(client: AuthenticatedSocket) {
    const user = client.data.user;

    if (!user?.userId) {
      client.disconnect();
      return null;
    }

    return user;
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('init')
  async handleNotifications(client: AuthenticatedSocket) {
    const user = this.authenticatedUser(client);

    if (!user) return;

    await client.join(`user:${user.userId}`);

    const notifications = await this.notificationService.getAllNotifications(
      user.userId,
    );

    client.emit('notifications:init', notifications);
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('notifications:read')
  async handleMarkAsRead(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() body: unknown,
  ) {
    const user = this.authenticatedUser(client);

    if (!user) return;

    const parsed = MarkAsReadSchema.safeParse(body);

    if (!parsed.success) {
      throw new WsException('Identificadores de notificaciones inválidos');
    }

    const result = await this.notificationService.markAsRead(
      user.userId,
      parsed.data.ids,
    );

    client.emit('notifications:unread-count', result);
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('notifications:read-all')
  async handleMarkAllAsRead(client: AuthenticatedSocket) {
    const user = this.authenticatedUser(client);

    if (!user) return;

    const result = await this.notificationService.markAsRead(user.userId);

    client.emit('notifications:unread-count', result);
  }

  sendNotification(userId: string, notification: NotificationRecord) {
    this.server
      ?.to(`user:${userId}`)
      .emit('notification:new', this.notificationService.toItem(notification));
  }
}
