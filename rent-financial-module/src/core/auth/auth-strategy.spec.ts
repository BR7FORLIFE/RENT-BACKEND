import { JwtPassport } from './auth-strategy.js';

describe('JwtPassport', () => {
  it('validate solo conserva userId y rols del payload', () => {
    const strategy = new JwtPassport();

    const result = strategy.validate({
      userId: 'u1',
      rols: ['ADMIN'],
      iat: 1,
      exp: 2,
    } as never);

    expect(result).toEqual({ userId: 'u1', rols: ['ADMIN'] });
  });
});
