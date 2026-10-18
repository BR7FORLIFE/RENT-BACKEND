import { NotificationService } from './notification.service.js';

const record = (overrides: Record<string, unknown> = {}) => ({
  id: 'n1',
  transmitterId: 'from',
  receiverId: 'to',
  source: 'CONTRACT_SERVICE',
  name: 'titulo',
  content: 'contenido',
  type: 'WARNING',
  readAt: null,
  createAt: new Date('2026-10-18T00:00:00.000Z'),
  updateAt: new Date('2026-10-18T00:00:00.000Z'),
  ...overrides,
});

describe('NotificationService', () => {
  const repo = {
    saveNotification: jest.fn(),
    findAllNotifications: jest.fn(),
    countUnread: jest.fn(),
    markAsRead: jest.fn(),
  };
  let service: NotificationService;

  beforeEach(() => {
    jest.resetAllMocks();
    service = new NotificationService(repo as never);
  });

  it('sendNotification persiste y retorna el registro guardado', async () => {
    const saved = record();
    repo.saveNotification.mockResolvedValue(saved);

    const result = await service.sendNotification(
      'from',
      'to',
      'contenido',
      'titulo',
      'CONTRACT_SERVICE',
      'INFO',
    );

    expect(repo.saveNotification).toHaveBeenCalledWith({
      transmitterId: 'from',
      receiverId: 'to',
      content: 'contenido',
      name: 'titulo',
      source: 'CONTRACT_SERVICE',
      type: 'INFO',
    });
    expect(result).toBe(saved);
  });

  it('getAllNotifications devuelve emitidas, recibidas y conteo de no leídas', async () => {
    repo.findAllNotifications.mockImplementation((_id: string, kind: string) =>
      Promise.resolve([record({ name: kind })]),
    );
    repo.countUnread.mockResolvedValue(4);

    const result = await service.getAllNotifications('u1');

    expect(repo.findAllNotifications).toHaveBeenCalledWith(
      'u1',
      'TRANSMITTER',
      50,
    );
    expect(repo.findAllNotifications).toHaveBeenCalledWith(
      'u1',
      'RECEIVER',
      50,
    );
    expect(result.unreadCount).toBe(4);
    expect(result.receiver[0]).toEqual({
      id: 'n1',
      transmitterId: 'from',
      receiverId: 'to',
      source: 'CONTRACT_SERVICE',
      name: 'RECEIVER',
      content: 'contenido',
      typeNotification: 'WARNING',
      readAt: null,
      createdAt: new Date('2026-10-18T00:00:00.000Z'),
    });
    expect(result.transmitter[0].name).toBe('TRANSMITTER');
  });

  it('markAsRead marca y devuelve el nuevo conteo de no leídas', async () => {
    repo.markAsRead.mockResolvedValue(2);
    repo.countUnread.mockResolvedValue(1);

    await expect(service.markAsRead('u1', ['a', 'b'])).resolves.toEqual({
      unreadCount: 1,
    });
    expect(repo.markAsRead).toHaveBeenCalledWith('u1', ['a', 'b']);
  });
});
