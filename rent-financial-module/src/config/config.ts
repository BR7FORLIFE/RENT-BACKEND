import axios from 'axios';
import { MicroserviceAuthService } from '../features/microservice-auth/auth-microservice.service.js';

//gmail config
export { gmailClient } from './gmail.js';

//axios config
export const axiosMicroserviceClient = axios.create();
export const axiosRentAuth = axios.create();

//instanciamos la clase donde extraeremos el JWT
const microserviceService = new MicroserviceAuthService();

axiosMicroserviceClient.interceptors.request.use(async (config) => {
  const JWT_MICROSERVICE_TOKEN = await microserviceService.getToken();
  config.headers.Authorization = `Bearer ${JWT_MICROSERVICE_TOKEN}`;
  return config;
});
