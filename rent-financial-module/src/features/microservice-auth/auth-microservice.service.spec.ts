import axios from 'axios';
import { MicroserviceAuthService } from './auth-microservice.service.js';
import { axiosRentAuth } from '../../config/config.js';

const post = axiosRentAuth.post as unknown as jest.Mock;

describe('MicroserviceAuthService', () => {
  let service: MicroserviceAuthService;

  beforeEach(() => {
    jest.resetAllMocks();
    jest.useFakeTimers().setSystemTime(new Date('2026-01-01T00:00:00Z'));
    service = new MicroserviceAuthService();
  });
  afterEach(() => jest.useRealTimers());

  it('obtainToken llama al microservicio con las credenciales y devuelve el JWT', async () => {
    post.mockResolvedValue({ data: { jwt: 'tok', expiredTimeSeconds: 60 } });

    await expect(service.obtainToken()).resolves.toBe('tok');
    expect(post).toHaveBeenCalledWith(
      'http://auth.test/rent-auth/microservice-identification',
      { clientId: 'financial-id', clientSecret: 'financial-secret' },
    );
  });

  it('getToken reutiliza el token mientras no esté por expirar', async () => {
    post.mockResolvedValue({ data: { jwt: 'tok', expiredTimeSeconds: 60 } });

    await service.getToken();
    jest.setSystemTime(new Date('2026-01-01T00:00:50Z'));
    await expect(service.getToken()).resolves.toBe('tok');

    expect(post).toHaveBeenCalledTimes(1);
  });

  it('getToken renueva 5s antes de la expiración real (margen de seguridad)', async () => {
    post
      .mockResolvedValueOnce({ data: { jwt: 'old', expiredTimeSeconds: 60 } })
      .mockResolvedValueOnce({ data: { jwt: 'new', expiredTimeSeconds: 60 } });

    await service.getToken();
    jest.setSystemTime(new Date('2026-01-01T00:00:55Z')); // 60 - 5 = 55s
    await expect(service.getToken()).resolves.toBe('new');

    expect(post).toHaveBeenCalledTimes(2);
  });

  it('envuelve errores de axios conservando la causa', async () => {
    const axiosErr = Object.assign(new Error('net'), { isAxiosError: true });
    jest.spyOn(axios, 'isAxiosError').mockReturnValue(true);
    post.mockRejectedValue(axiosErr);

    await expect(service.obtainToken()).rejects.toMatchObject({
      message: 'Error al obtener el token de acceso',
      cause: axiosErr,
    });
  });

  it('relanza errores que no son de axios tal cual', async () => {
    const err = new Error('otro');
    jest.spyOn(axios, 'isAxiosError').mockReturnValue(false);
    post.mockRejectedValue(err);

    await expect(service.obtainToken()).rejects.toBe(err);
  });

  it('tras un fallo el siguiente getToken vuelve a pedir token', async () => {
    jest.spyOn(axios, 'isAxiosError').mockReturnValue(false);
    post.mockRejectedValueOnce(new Error('x'));
    await expect(service.getToken()).rejects.toThrow('x');

    post.mockResolvedValueOnce({ data: { jwt: 'ok', expiredTimeSeconds: 60 } });
    await expect(service.getToken()).resolves.toBe('ok');
  });
});
