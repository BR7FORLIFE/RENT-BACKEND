import { generateKeyPairSync } from 'node:crypto';

// Stub de src/config/env.ts: evita leer public.pem y variables reales durante los tests.
// Se genera un par RSA efímero para poder firmar JWT RS256 válidos en los e2e.
const { publicKey, privateKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

export const TEST_PRIVATE_KEY = privateKey;
export const PUBLIC_RSA_KEY = publicKey;

export const MICROSERVICE_CLIENT_ID = 'test-client-id';
export const MICROSERVICE_CLIENT_SECRET = 'test-client-secret';
export const POSTGRES_URI = 'postgresql://test:test@localhost:5432/test';
export const OLLAMA_HOST = 'http://localhost:11434';
export const OLLAMA_MODEL = 'test-model';
export const RENT_AUTH_HOST = 'http://auth.test';
export const RENT_FINANCIAL_CLIENT_ID = 'financial-id';
export const RENT_FINANCIAL_CLIENT_SECRET = 'financial-secret';
export const GMAIL_CLIENT_ID = 'gmail-client-id';
export const GMAIL_CLIENT_SECRET = 'gmail-client-secret';
export const GMAIL_REFRESH_TOKEN = 'gmail-refresh-token';
export const ISSUER_EMAIL = 'noreply@test.dev';
export const PUBLIC_BASE_URL = 'http://public.test';
export const MODEL_API_URL = 'http://model.test';
export const MODEL_API_KEY = undefined;
