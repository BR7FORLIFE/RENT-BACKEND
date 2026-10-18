import { NotificationRepository } from './notification.repository.js';

describe('NotificationRepository', () => {
  const prisma = {
    notifications: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      updateMany: jest.fn(),
    },
  };
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

  it('RECEIVER: filtra por receiverId, orden desc y respeta el límite', async () => {
    await repo.findAllNotifications('u1', 'RECEIVER', 50);
    expect(prisma.notifications.findMany).toHaveBeenCalledWith({
      where: { receiverId: 'u1' },
      orderBy: { createAt: 'desc' },
      take: 50,
    });
  });

  it('TRANSMITTER: filtra por transmitterId, orden desc y respeta el límite', async () => {
    await repo.findAllNotifications('u1', 'TRANSMITTER', 50);
    expect(prisma.notifications.findMany).toHaveBeenCalledWith({
      where: { transmitterId: 'u1' },
      orderBy: { createAt: 'desc' },
      take: 50,
    });
  });

  it('countUnread cuenta solo las no leídas del receptor', async () => {
    prisma.notifications.count.mockResolvedValue(3);
    await expect(repo.countUnread('u1')).resolves.toBe(3);
    expect(prisma.notifications.count).toHaveBeenCalledWith({
      where: { receiverId: 'u1', readAt: null },
    });
  });

  it('markAsRead limita por receptor, no leídas e ids dados', async () => {
    prisma.notifications.updateMany.mockResolvedValue({ count: 2 });
    await expect(repo.markAsRead('u1', ['a', 'b'])).resolves.toBe(2);
    expect(prisma.notifications.updateMany).toHaveBeenCalledWith({
      where: { receiverId: 'u1', readAt: null, id: { in: ['a', 'b'] } },
      data: { readAt: expect.any(Date) },
    });
  });

  it('markAsRead sin ids marca todas las no leídas del receptor', async () => {
    prisma.notifications.updateMany.mockResolvedValue({ count: 5 });
    await repo.markAsRead('u1');
    expect(prisma.notifications.updateMany).toHaveBeenCalledWith({
      where: { receiverId: 'u1', readAt: null },
      data: { readAt: expect.any(Date) },
    });
  });

  it('respeta el cliente transaccional', async () => {
    const tx = { notifications: { create: jest.fn() } };
    await repo.saveNotification({} as never, tx as never);
    expect(tx.notifications.create).toHaveBeenCalled();
    expect(prisma.notifications.create).not.toHaveBeenCalled();
  });
});
