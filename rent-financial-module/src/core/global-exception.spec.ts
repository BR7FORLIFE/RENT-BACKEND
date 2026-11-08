import {
  AppException,
  EmailSendException,
  UserNotFound,
} from './global-exception.js';

describe('global exceptions', () => {
  it('EmailSendException expone 503 y el error original', () => {
    const e = new EmailSendException('boom');
    expect(e).toBeInstanceOf(AppException);
    expect(e).toBeInstanceOf(Error);
    expect(e.status).toBe(503);
    expect(e.error).toBe('boom');
    expect(e.name).toBe('EmailSendException');
  });

  it('UserNotFound expone 406 NOT_ACCEPTABLE', () => {
    const e = new UserNotFound();
    expect(e.status).toBe(406);
    expect(e.error).toBe('NOT_ACCEPTABLE');
  });
});
