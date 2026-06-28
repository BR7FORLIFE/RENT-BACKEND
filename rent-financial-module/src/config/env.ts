import { readFileSync } from 'fs';
import * as dotenv from 'dotenv';

dotenv.config();

function obtainPublicKey() {
  const file = readFileSync('public.pem', 'utf-8');
  return file;
}

export const PUBLIC_RSA_KEY = obtainPublicKey();

export const POSTGRES_URI = process.env.POSTGRES_URI;
