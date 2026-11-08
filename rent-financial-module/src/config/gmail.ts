import axios from 'axios';
import {
  GMAIL_CLIENT_ID,
  GMAIL_CLIENT_SECRET,
  GMAIL_REFRESH_TOKEN,
  ISSUER_EMAIL,
} from './env.js';

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const SEND_URL = 'https://gmail.googleapis.com/gmail/v1/users/me/messages/send';

let cachedToken: { value: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.value;
  }
  const body = new URLSearchParams({
    client_id: GMAIL_CLIENT_ID ?? '',
    client_secret: GMAIL_CLIENT_SECRET ?? '',
    refresh_token: GMAIL_REFRESH_TOKEN ?? '',
    grant_type: 'refresh_token',
  });
  const { data } = await axios.post<{
    access_token?: string;
    expires_in?: number;
  }>(TOKEN_URL, body.toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
  if (!data.access_token) {
    throw new Error('Gmail no devolvio access_token');
  }
  cachedToken = {
    value: data.access_token,
    expiresAt: Date.now() + (data.expires_in ?? 3300) * 1000,
  };
  return data.access_token;
}

function buildRawMessage(to: string, subject: string, html: string) {
  const encodedSubject = `=?UTF-8?B?${Buffer.from(subject, 'utf-8').toString('base64')}?=`;
  const body = (
    Buffer.from(html, 'utf-8')
      .toString('base64')
      .match(/.{1,76}/g) ?? []
  ).join('\r\n');
  const message =
    `From: ${ISSUER_EMAIL}\r\n` +
    `To: ${to}\r\n` +
    `Subject: ${encodedSubject}\r\n` +
    'MIME-Version: 1.0\r\n' +
    'Content-Type: text/html; charset=UTF-8\r\n' +
    'Content-Transfer-Encoding: base64\r\n\r\n' +
    body;
  return Buffer.from(message, 'utf-8').toString('base64url');
}

/** Envia correos con la API de Gmail (users.messages.send) via OAuth2 refresh token. */
export const gmailClient = {
  async send(params: { to: string; subject: string; html: string }) {
    const token = await getAccessToken();
    try {
      await axios.post(
        SEND_URL,
        { raw: buildRawMessage(params.to, params.subject, params.html) },
        { headers: { Authorization: `Bearer ${token}` } },
      );
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        cachedToken = null;
      }
      throw err;
    }
  },
};
