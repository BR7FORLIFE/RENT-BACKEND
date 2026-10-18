import { WsException } from '@nestjs/websockets';
import { NotificationGateway } from './notification.gateway.js';

describe('NotificationGateway', () => {
  const service = {
    getAllNotifications: jest.fn(),
    markAsRead: jest.fn(),
    toItem: jest.fn(),
  };
  let gateway: NotificationGateway;

  const authenticatedClient = () => ({
    data: { user: { userId: 'u1', rols: [] } },
    join: jest.fn(),
    emit: jest.fn(),
    disconnect: jest.fn(),
  });

  beforeEach(() => {
    jest.resetAllMocks();
    gateway = new NotificationGateway(service as never);
  });

  describe('init', () => {
    it('une al socket a la room user:<id>, carga notificaciones y las emite', async () => {
      const payload = { receiver: [], transmitter: [], unreadCount: 0 };
      service.getAllNotifications.mockResolvedValue(payload);
      const client = authenticatedClient();

      await gateway.handleNotifications(client as never);

      expect(client.join).toHaveBeenCalledWith('user:u1');
      expect(service.getAllNotifications).toHaveBeenCalledWith('u1');
      expect(client.emit).toHaveBeenCalledWith('notifications:init', payload);
      expect(client.disconnect).not.toHaveBeenCalled();
    });

    it('desconecta si el guard no dejó usuario autenticado', async () => {
      const client = { ...authenticatedClient(), data: { user: false } };

      await gateway.handleNotifications(client as never);

      expect(client.disconnect).toHaveBeenCalled();
      expect(client.join).not.toHaveBeenCalled();
      expect(service.getAllNotifications).not.toHaveBeenCalled();
    });
  });

  describe('notifications:read', () => {
    const id = '7dafb0f7-2a7e-458e-87b3-e7b20ae48865';

    it('marca como leídas las notificaciones del usuario y emite el conteo', async () => {
      service.markAsRead.mockResolvedValue({ unreadCount: 2 });
      const client = authenticatedClient();

      await gateway.handleMarkAsRead(client as never, { ids: [id] });

      expect(service.markAsRead).toHaveBeenCalledWith('u1', [id]);
      expect(client.emit).toHaveBeenCalledWith('notifications:unread-count', {
        unreadCount: 2,
      });
    });

    it('rechaza ids inválidos', async () => {
      const client = authenticatedClient();

      await expect(
        gateway.handleMarkAsRead(client as never, { ids: ['no-uuid'] }),
      ).rejects.toBeInstanceOf(WsException);
      expect(service.markAsRead).not.toHaveBeenCalled();
    });

    it('desconecta si no hay usuario autenticado', async () => {
      const client = { ...authenticatedClient(), data: {} };

      await gateway.handleMarkAsRead(client as never, { ids: [id] });

      expect(client.disconnect).toHaveBeenCalled();
      expect(service.markAsRead).not.toHaveBeenCalled();
    });
  });

  describe('notifications:read-all', () => {
    it('marca todas las notificaciones del usuario', async () => {
      service.markAsRead.mockResolvedValue({ unreadCount: 0 });
      const client = authenticatedClient();

      await gateway.handleMarkAllAsRead(client as never);

      expect(service.markAsRead).toHaveBeenCalledWith('u1');
      expect(client.emit).toHaveBeenCalledWith('notifications:unread-count', {
        unreadCount: 0,
      });
    });
  });

  describe('sendNotification', () => {
    it('emite notification:new serializado solo a la room del usuario', () => {
      const emit = jest.fn();
      const to = jest.fn().mockReturnValue({ emit });
      gateway.server = { to } as never;
      const item = { id: 'n1' };
      service.toItem.mockReturnValue(item);
      const notification = { name: 'n' } as never;

      gateway.sendNotification('u2', notification);

      expect(service.toItem).toHaveBeenCalledWith(notification);
      expect(to).toHaveBeenCalledWith('user:u2');
      expect(emit).toHaveBeenCalledWith('notification:new', item);
    });

    it('no falla si el servidor Socket.IO aún no está inicializado', () => {
      gateway.server = undefined as never;

      expect(() => gateway.sendNotification('u2', {} as never)).not.toThrow();
    });
  });
});
