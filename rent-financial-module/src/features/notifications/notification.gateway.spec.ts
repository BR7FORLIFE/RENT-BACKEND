import { NotificationGateway } from './notification.gateway.js';

describe('NotificationGateway', () => {
  const service = { getAllNotifications: jest.fn() };
  let gateway: NotificationGateway;

  beforeEach(() => {
    jest.resetAllMocks();
    gateway = new NotificationGateway(service as never);
  });

  describe('init', () => {
    it('une al socket a la room user:<id>, carga notificaciones y las emite', async () => {
      const payload = { receiver: [], transmitter: [] };
      service.getAllNotifications.mockResolvedValue(payload);
      const client = {
        data: { user: { userId: 'u1', rols: [] } },
        join: jest.fn(),
        emit: jest.fn(),
        disconnect: jest.fn(),
      };

      await gateway.handleNotifications(client as never);

      expect(client.join).toHaveBeenCalledWith('user:u1');
      expect(service.getAllNotifications).toHaveBeenCalledWith('u1');
      expect(client.emit).toHaveBeenCalledWith('notifications:init', payload);
      expect(client.disconnect).not.toHaveBeenCalled();
    });

    it('desconecta si el guard no dejó usuario autenticado', async () => {
      const client = {
        data: {},
        join: jest.fn(),
        emit: jest.fn(),
        disconnect: jest.fn(),
      };

      await gateway.handleNotifications(client as never);

      expect(client.disconnect).toHaveBeenCalled();
      expect(client.join).not.toHaveBeenCalled();
      expect(service.getAllNotifications).not.toHaveBeenCalled();
    });
  });

  it('sendNotification emite notification:new solo a la room del usuario', () => {
    const emit = jest.fn();
    const to = jest.fn().mockReturnValue({ emit });
    gateway.server = { to } as never;
    const notification = { name: 'n' } as never;

    gateway.sendNotification('u2', notification);

    expect(to).toHaveBeenCalledWith('user:u2');
    expect(emit).toHaveBeenCalledWith('notification:new', notification);
  });
});
