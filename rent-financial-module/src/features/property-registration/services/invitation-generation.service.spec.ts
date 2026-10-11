import {
  escapeHtml,
  generateSecureString,
  sendInvitedEmailTo,
} from './invitation-generation.service.js';
import { resendClient } from '../../../config/config.js';
import { ResendException } from '../../../core/global-exception.js';

const send = resendClient.emails.send as jest.Mock;

describe('generateSecureString', () => {
  it('genera la longitud pedida solo con caracteres alfanuméricos', () => {
    const value = generateSecureString(64);
    expect(value).toHaveLength(64);
    expect(value).toMatch(/^[A-Za-z0-9]+$/);
  });

  it('produce valores distintos en llamadas sucesivas', () => {
    const values = new Set(
      Array.from({ length: 50 }, () => generateSecureString(20)),
    );
    expect(values.size).toBe(50);
  });

  it('longitud 0 devuelve cadena vacía', () => {
    expect(generateSecureString(0)).toBe('');
  });
});

describe('sendInvitedEmailTo', () => {
  beforeEach(() => send.mockReset());

  it('envía el correo con el token en el enlace y el nombre de la propiedad', async () => {
    send.mockResolvedValue({ error: null });

    await sendInvitedEmailTo('dest@test.dev', 'TOKEN123', 'Casa Azul');

    const arg = send.mock.calls[0][0];
    expect(arg.to).toBe('dest@test.dev');
    expect(arg.from).toBe('noreply@test.dev');
    expect(arg.subject).toContain('Casa Azul');
    expect(arg.html).toContain('accept-invitation?token=TOKEN123');
  });

  it('lanza ResendException si Resend responde con error', async () => {
    send.mockResolvedValue({ error: { message: 'cuota excedida' } });

    await expect(sendInvitedEmailTo('a@b.co', 't', 'p')).rejects.toBeInstanceOf(
      ResendException,
    );
  });
});

describe('sendInvitedEmailTo (seguridad y configuración)', () => {
  beforeEach(() => send.mockReset());

  it('escapa HTML en el nombre de la propiedad (B17)', async () => {
    send.mockResolvedValue({ error: null });

    await sendInvitedEmailTo('a@b.co', 't', '<script>alert(1)</script>');

    const { html } = send.mock.calls[0][0];
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });

  it('usa PUBLIC_BASE_URL en el enlace (sin dominios hardcodeados)', async () => {
    send.mockResolvedValue({ error: null });

    await sendInvitedEmailTo('a@b.co', 'tok', 'Casa');

    expect(send.mock.calls[0][0].html).toContain(
      'http://public.test/rent-financial/property-process-public/accept-invitation?token=tok',
    );
    expect(send.mock.calls[0][0].html).not.toContain('ngrok');
  });
});

describe('escapeHtml', () => {
  it('escapa los caracteres peligrosos', () => {
    expect(escapeHtml(`<a href="x">'&'</a>`)).toBe(
      '&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;',
    );
  });
});
