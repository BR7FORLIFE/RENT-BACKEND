import {
  AppException,
  ResendException,
  UserNotFound,
} from './global-exception.js';

describe('global exceptions', () => {
  it('ResendException expone 503 y el error original', () => {
    const e = new ResendException('boom');
    expect(e).toBeInstanceOf(AppException);
    expect(e).toBeInstanceOf(Error);
    expect(e.status).toBe(503);
    expect(e.error).toBe('boom');
    expect(e.name).toBe('ResendException');
  });

  it('UserNotFound expone 406 NOT_ACCEPTABLE', () => {
    const e = new UserNotFound();
    expect(e.status).toBe(406);
    expect(e.error).toBe('NOT_ACCEPTABLE');
  });
});
