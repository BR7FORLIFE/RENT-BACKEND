import { UseGuards } from '@nestjs/common';
import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';

import { Server } from 'socket.io';
import { WsJwtGuard } from '../../core/auth/ws.guard.js';
import type { AuthenticatedSocket } from '../../types/global-types.js';
import { NotificationService } from './notification.service.js';
import type { NotificationType } from '../global/global.schema.js';

@WebSocketGateway({
  namespace: 'notifications', //punto de entrada para el gateway de notificaciones
  cors: {
    origin: '*', //esto se configura con el origen del cliente
  },
})
export class NotificationGateway {
  constructor(private readonly notificationService: NotificationService) {}

  @WebSocketServer()
  server: Server; //importante ya que es una instancia de Socket.IO

  //este metodo permite que el usuario se conecte pr primera vez y recupera todas
  //las notificaciones para estar al dia

  /**
   *  CREAMOS UN SOLO FLUJO WEBSOCKETS
   *
   *  init -> notifications:new (cliente - servidor)
   * notifications:new -> init (servidor - cliente) | notificaciones
   *
   *
   */
  @UseGuards(WsJwtGuard)
  @SubscribeMessage('init')
  async handleNotifications(client: AuthenticatedSocket) {
    const user = client.data.user;

    if (!user) {
      client.disconnect();
      return;
    }

    // es una room que nos permite enviar mensaje a un usuario en especifico
    await client.join(`user:${user.userId}`);

    const notifications = await this.notificationService.getAllNotifications(
      user.userId,
    ); //obtenemos todas las notificaciones vinculadas al usuario

    client.emit('notifications:init', notifications); //emitimos las notificaciones
  }

  sendNotification(userId: string, notification: NotificationType) {
    //enviamos la notificacion al usuario por el evento llamado notification:new
    this.server.to(`user:${userId}`).emit('notification:new', notification);
  }
}
