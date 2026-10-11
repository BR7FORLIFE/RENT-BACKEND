import axios from 'axios';
import { getAllUsers, getUserData } from './api.js';
import { axiosMicroserviceClient } from '../../config/config.js';

const get = axiosMicroserviceClient.get as unknown as jest.Mock;
const post = axiosMicroserviceClient.post as unknown as jest.Mock;

describe('api (cliente del microservicio de auth)', () => {
  beforeEach(() => jest.resetAllMocks());

  describe('getUserData', () => {
    it('consulta por email o userId vía query params', async () => {
      get.mockResolvedValue({ data: { userId: 'u1' } });

      await expect(getUserData('a@b.co', null)).resolves.toEqual({
        userId: 'u1',
      });
      expect(get).toHaveBeenCalledWith(
        'http://auth.test/rent-auth/microservice-identification/user',
        { params: { email: 'a@b.co', userId: null } },
      );
    });

    it('propaga el mensaje del microservicio cuando es un error de axios', async () => {
      const err = { response: { data: { message: 'usuario inexistente' } } };
      jest.spyOn(axios, 'isAxiosError').mockReturnValue(true);
      get.mockRejectedValue(err);

      await expect(getUserData(null, 'u1')).rejects.toMatchObject({
        message: 'usuario inexistente',
        cause: err,
      });
    });

    it('relanza errores no-axios', async () => {
      const err = new Error('x');
      jest.spyOn(axios, 'isAxiosError').mockReturnValue(false);
      get.mockRejectedValue(err);

      await expect(getUserData(null, 'u1')).rejects.toBe(err);
    });
  });

  describe('getAllUsers', () => {
    it('envía usersIds y desempaqueta data.users', async () => {
      post.mockResolvedValue({ data: { users: [{ userId: 'u1' }] } });

      await expect(getAllUsers(['u1'])).resolves.toEqual([{ userId: 'u1' }]);
      expect(post).toHaveBeenCalledWith(
        'http://auth.test/rent-auth/microservice-identification/users',
        { usersIds: ['u1'] },
      );
    });

    it('propaga el mensaje de error del microservicio', async () => {
      jest.spyOn(axios, 'isAxiosError').mockReturnValue(true);
      post.mockRejectedValue({ response: { data: { message: 'falló' } } });

      await expect(getAllUsers([])).rejects.toThrow('falló');
    });
  });
});
