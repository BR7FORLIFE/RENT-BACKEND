import { ServiceNotifier } from './service-notifier.service.js';

describe('ServiceNotifier', () => {
  const notificationService = { sendNotification: jest.fn() };
  const gateway = { sendNotification: jest.fn() };
  let notifier: ServiceNotifier;

  beforeEach(() => {
    jest.resetAllMocks();
    notifier = new ServiceNotifier(
      notificationService as never,
      gateway as never,
    );
  });

  it('persiste y emite por WebSocket al destinatario correcto (sin duplicados ni al emisor)', async () => {
    notificationService.sendNotification.mockResolvedValue({ id: 'n' });
    await notifier.notify('u1', ['u2', 'u2', 'u1'], 'Titulo', 'Contenido');

    expect(notificationService.sendNotification).toHaveBeenCalledTimes(1);
    expect(notificationService.sendNotification).toHaveBeenCalledWith(
      'u1',
      'u2',
      'Contenido',
      'Titulo',
      'SERVICE_REQUEST_SERVICE',
      'INFO',
    );
    expect(gateway.sendNotification).toHaveBeenCalledWith('u2', { id: 'n' });
  });

  it('un fallo al notificar no se propaga ni afecta a los demas destinatarios', async () => {
    notificationService.sendNotification
      .mockRejectedValueOnce(new Error('ws caido'))
      .mockResolvedValueOnce({ id: 'n2' });
    await expect(
      notifier.notify('u1', ['u2', 'u3'], 't', 'c'),
    ).resolves.toBeUndefined();
    expect(gateway.sendNotification).toHaveBeenCalledTimes(1);
    expect(gateway.sendNotification).toHaveBeenCalledWith('u3', { id: 'n2' });
  });
});
