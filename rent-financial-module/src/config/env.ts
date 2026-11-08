import { readFileSync } from 'fs';
import * as dotenv from 'dotenv';

dotenv.config();

//variables de identidad para el microservicio de rent financial
export const MICROSERVICE_CLIENT_ID = process.env.CLIENT_ID;
export const MICROSERVICE_CLIENT_SECRET = process.env.CLIENT_SECRET;

//public Key del microservicio de autentication
function obtainPublicKey() {
  const file = readFileSync('public.pem', 'utf-8');
  return file;
}

export const PUBLIC_RSA_KEY = obtainPublicKey();

//URI base de datos de rent financial
export const POSTGRES_URI = process.env.POSTGRES_URI;

//Variables de entorno de ollama
export const OLLAMA_HOST =
  process.env.OLLAMA_HOST ?? 'http://host.docker.internal:11434';
export const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? 'granite3-dense:2b';

// MICROSERVICE IDENTIFICATION
export const RENT_AUTH_HOST = process.env.RENT_AUTH_HOST;
export const RENT_FINANCIAL_CLIENT_ID = process.env.RENT_FINANCIAL_CLIENT_ID;
export const RENT_FINANCIAL_CLIENT_SECRET =
  process.env.RENT_FINANCIAL_CLIENT_SECRET;

//Gmail API (OAuth2 refresh token, scope gmail.send)
export const GMAIL_CLIENT_ID = process.env.OAUTH2_CLIENT_ID;
export const GMAIL_CLIENT_SECRET = process.env.OAUTH2_CLIENT_SECRET;
export const GMAIL_REFRESH_TOKEN = process.env.GMAIL_REFRESH_TOKEN;

//URL publica de este servicio (se usa en los enlaces de los correos)
export const PUBLIC_BASE_URL = (
  process.env.PUBLIC_BASE_URL ?? 'http://localhost:3002'
).replace(/\/$/, '');

export const ISSUER_EMAIL = process.env.ISSUER_EMAIL;

//API Python del modelo de prediccion (RENT-BACKEND/modelo). Servicio interno, no se expone por nginx
export const MODEL_API_URL = (
  process.env.MODEL_API_URL ?? 'http://model:8000'
).replace(/\/$/, '');
export const MODEL_API_KEY = process.env.MODEL_API_KEY;
