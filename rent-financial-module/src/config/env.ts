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

//Resend ENVIROMENT VARIABLES
export const RESEND_API_KEY = process.env.RESEND_API_KEY;

export const ISSUER_EMAIL = process.env.ISSUER_EMAIL;
