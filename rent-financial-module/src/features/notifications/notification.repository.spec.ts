import { NotificationRepository } from './notification.repository.js';

describe('NotificationRepository', () => {
  const prisma = { notifications: { create: jest.fn(), findMany: jest.fn() } };
  let repo: NotificationRepository;

  beforeEach(() => {
    jest.resetAllMocks();
    repo = new NotificationRepository(prisma as never);
  });

  it('saveNotification crea el registro', async () => {
    const data = { content: 'x' } as never;
    await repo.saveNotification(data);
    expect(prisma.notifications.create).toHaveBeenCalledWith({ data });
  });

  it('RECEIVER: filtra por receiverId, orden desc y máximo 10', async () => {
    await repo.findAllNotifications('u1', 'RECEIVER');
    expect(prisma.notifications.findMany).toHaveBeenCalledWith({
      where: { receiverId: 'u1' },
      orderBy: { createAt: 'desc' },
      take: 10,
    });
  });

  it('TRANSMITTER: filtra por transmitterId', async () => {
    await repo.findAllNotifications('u1', 'TRANSMITTER');
    expect(prisma.notifications.findMany).toHaveBeenCalledWith({
      where: { transmitterId: 'u1' },
    });
  });

  it('respeta el cliente transaccional', async () => {
    const tx = { notifications: { create: jest.fn() } };
    await repo.saveNotification({} as never, tx as never);
    expect(tx.notifications.create).toHaveBeenCalled();
    expect(prisma.notifications.create).not.toHaveBeenCalled();
  });
});
