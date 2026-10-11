import type { ExecutionContext } from '@nestjs/common';
import { WsJwtGuard } from './ws.guard.js';

function wsContext(client: unknown) {
  return {
    switchToWs: () => ({ getClient: () => client }),
  } as unknown as ExecutionContext;
}

describe('WsJwtGuard', () => {
  const guard = new WsJwtGuard();

  it('getRequest construye el header Authorization desde handshake.auth.token', () => {
    const ctx = wsContext({ handshake: { auth: { token: 'abc' } } });

    expect(guard.getRequest(ctx)).toEqual({
      headers: { authorization: 'Bearer abc' },
    });
  });

  it('handleRequest guarda el usuario en client.data.user y lo retorna', () => {
    const client = { data: {} as Record<string, unknown> };
    const user = { userId: 'u1', rols: [] };

    const result = guard.handleRequest(null, user, null, wsContext(client));

    expect(result).toBe(user);
    expect(client.data.user).toBe(user);
  });

  it('handleRequest NO lanza si no hay usuario (el gateway debe desconectar)', () => {
    const client = { data: {} as Record<string, unknown> };

    expect(() =>
      guard.handleRequest(new Error('bad'), undefined, null, wsContext(client)),
    ).not.toThrow();
    expect(client.data.user).toBeUndefined();
  });
});
