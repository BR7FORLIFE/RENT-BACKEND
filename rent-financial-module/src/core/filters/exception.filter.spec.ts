import {
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
  type ArgumentsHost,
} from '@nestjs/common';
import { z } from 'zod';
import { GlobalExceptionFilter } from './exception.filter.js';
import { AppException, UserNotFound } from '../global-exception.js';

function buildHost() {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  const host = {
    switchToHttp: () => ({
      getRequest: () => ({ path: '/rent-financial/test' }),
      getResponse: () => ({ status }),
    }),
  } as unknown as ArgumentsHost;
  return { host, status, json };
}

describe('GlobalExceptionFilter', () => {
  const filter = new GlobalExceptionFilter();

  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
  });
  afterEach(() => jest.restoreAllMocks());

  it('mapea AppException a su status y cuerpo estándar', () => {
    const { host, status, json } = buildHost();

    filter.catch(new UserNotFound(), host);

    expect(status).toHaveBeenCalledWith(406);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'El usuario no encontrado',
        error: 'NOT_ACCEPTABLE',
        path: '/rent-financial/test',
        localDatetime: expect.any(String),
      }),
    );
  });

  it('respeta status personalizados de subclases de AppException', () => {
    class Custom extends AppException {
      constructor() {
        super('custom', 418, 'TEAPOT');
      }
    }
    const { host, status } = buildHost();

    filter.catch(new Custom(), host);

    expect(status).toHaveBeenCalledWith(418);
  });

  it('mapea ZodError a 406 con el código del primer issue', () => {
    const result = z.object({ a: z.string() }).safeParse({ a: 1 });
    const { host, status, json } = buildHost();

    filter.catch(result.error, host);

    expect(status).toHaveBeenCalledWith(406);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'invalid_type',
        message: 'Los datos enviados no cumplen con la estructura esperada!',
      }),
    );
  });

  it('responde 500 genérico ante errores desconocidos sin filtrar detalles', () => {
    const { host, status, json } = buildHost();

    filter.catch(new Error('secreto interno'), host);

    expect(status).toHaveBeenCalledWith(500);
    const body = json.mock.calls[0][0];
    expect(body.error).toBe('INTERNAL_SERVER_ERROR');
    expect(JSON.stringify(body)).not.toContain('secreto interno');
  });

  // BUG conocido: toda HttpException de Nest (401 de Passport, 404 de ruta, 403 de guard)
  // termina como 500 porque el filtro solo distingue AppException y ZodError.
  it('conserva el status de las HttpException de Nest', () => {
    const { host, status } = buildHost();

    filter.catch(new UnauthorizedException(), host);

    expect(status).toHaveBeenCalledWith(401);
  });

  it.each([
    [new UnauthorizedException(), 401],
    [new ForbiddenException(), 403],
    [new NotFoundException(), 404],
  ])('mapea %p a su status HTTP', (exception, expected) => {
    const { host, status } = buildHost();

    filter.catch(exception, host);

    expect(status).toHaveBeenCalledWith(expected);
  });
});
