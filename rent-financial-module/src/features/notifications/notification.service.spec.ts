import { NotificationService } from './notification.service.js';

describe('NotificationService', () => {
  const tx = { tx: true };
  const prisma = { $transaction: jest.fn() };
  const repo = { saveNotification: jest.fn(), findAllNotifications: jest.fn() };
  let service: NotificationService;

  beforeEach(() => {
    jest.resetAllMocks();
    prisma.$transaction.mockImplementation((cb: (t: unknown) => unknown) =>
      cb(tx),
    );
    service = new NotificationService(prisma as never, repo as never);
  });

  it('sendNotification persiste y retorna la notificación construida', async () => {
    const result = await service.sendNotification(
      'from',
      'to',
      'contenido',
      'titulo',
      'CONTRACT_SERVICE',
      'INFO',
    );

    const expected = {
      transmitterId: 'from',
      receiverId: 'to',
      content: 'contenido',
      name: 'titulo',
      source: 'CONTRACT_SERVICE',
      type: 'INFO',
    };
    expect(repo.saveNotification).toHaveBeenCalledWith(expected);
    expect(result).toEqual(expected);
  });

  it('getAllNotifications consulta emisor y receptor dentro de una transacción y mapea campos', async () => {
    repo.findAllNotifications.mockImplementation((_id: string, kind: string) =>
      Promise.resolve([
        { name: kind, content: `c-${kind}`, type: 'WARNING', id: 'ignored' },
      ]),
    );

    const result = await service.getAllNotifications('u1');

    expect(repo.findAllNotifications).toHaveBeenCalledWith(
      'u1',
      'TRANSMITTER',
      tx,
    );
    expect(repo.findAllNotifications).toHaveBeenCalledWith(
      'u1',
      'RECEIVER',
      tx,
    );
    expect(result).toEqual({
      transmitter: [
        {
          name: 'TRANSMITTER',
          content: 'c-TRANSMITTER',
          typeNotification: 'WARNING',
        },
      ],
      receiver: [
        {
          name: 'RECEIVER',
          content: 'c-RECEIVER',
          typeNotification: 'WARNING',
        },
      ],
    });
  });
});
