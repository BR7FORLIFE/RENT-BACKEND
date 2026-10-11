import { GlobalRepository } from './repository-global.js';

describe('GlobalRepository', () => {
  const prisma = {
    direction: { create: jest.fn() },
    resourceImages: { create: jest.fn() },
    invitationLinked: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  };
  const repo = new GlobalRepository(prisma as never);

  beforeEach(() => jest.clearAllMocks());

  it('saveDirection', async () => {
    await repo.saveDirection({ city: 'x' } as never);
    expect(prisma.direction.create).toHaveBeenCalledWith({
      data: { city: 'x' },
    });
  });

  it('saveAssetResource', async () => {
    await repo.saveAssetResource({ url: 'u' });
    expect(prisma.resourceImages.create).toHaveBeenCalledWith({
      data: { url: 'u' },
    });
  });

  it('saveInvitationLinked', async () => {
    await repo.saveInvitationLinked({ token: 't' } as never);
    expect(prisma.invitationLinked.create).toHaveBeenCalledWith({
      data: { token: 't' },
    });
  });

  it('findPropertyInvitationByToken busca por token', async () => {
    await repo.findPropertyInvitationByToken('tok');
    expect(prisma.invitationLinked.findFirst).toHaveBeenCalledWith({
      where: { token: 'tok' },
    });
  });

  it('usa el cliente transaccional si se provee', async () => {
    const tx = { direction: { create: jest.fn() } };
    await repo.saveDirection({} as never, tx as never);
    expect(tx.direction.create).toHaveBeenCalled();
    expect(prisma.direction.create).not.toHaveBeenCalled();
  });

  it('markInvitationAsConsumed cambia el estado a CONSUMED', async () => {
    await repo.markInvitationAsConsumed('inv1');
    expect(prisma.invitationLinked.update).toHaveBeenCalledWith({
      where: { id: 'inv1' },
      data: { status: 'CONSUMED' },
    });
  });
});
