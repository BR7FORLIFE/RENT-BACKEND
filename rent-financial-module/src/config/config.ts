import { Resend } from 'resend';
import axios from 'axios';
import { MicroserviceAuthService } from '../features/microservice-auth/auth-microservice.service.js';
import { RESEND_API_KEY } from './env.js';

//resend config
export const resendClient = new Resend(RESEND_API_KEY);

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
