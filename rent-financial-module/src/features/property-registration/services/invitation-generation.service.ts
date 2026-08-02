//servicio para la generacion de enlaces de invitacion seguros para
//los miembros de una propiedad

/**
 *  ¿Que debe hacer este servicio?
 *
 * - Recibir el propietario del inmueble y los datos de la persona que queremos vincular (Email)
 * - Generar el token aleatorio con alta entropia para crear el enlace
 * - Persistir en una base de datos con un estado de aceptacion, expiracion, revocacion o rechazo
 * - Generar el mecanismo de comunicacion y enviarlo
 * - Validar el enlace por parte del miembro que desea vincularse
 */
import { webcrypto } from 'node:crypto';
import { resendClient } from '../../../config/config.js';
import { ResendException } from '../../../core/global-exception.js';
import { ISSUER_EMAIL } from '../../../config/env.js';

export function generateSecureString(length: number) {
  //funcion para generar cadenas aleatorias
  const charset =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  const array = new Uint32Array(length);
  webcrypto.getRandomValues(array);

  let result = '';
  for (let i = 0; i < length; i++) {
    result += charset[array[i] % charset.length];
  }
  return result;
}

/**
 *Disponible en produccion
 *
 * @param to -> a que correo se enviara la invitacion
 * @param from -> correo del emisor
 */
export async function sendInvitedEmailTo(
  to: string,
  token: string,
  propertyName: string,
) {
  const ACCEPT_INVITATION_PATH = `https://judiciary-dingo-alias.ngrok-free.dev/rent-financial/property-process-public/accept-invitation?token=${token}`;

  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    </head>
    <body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:40px 0;">
        <tr>
          <td align="center">

            <table
              role="presentation"
              width="600"
              cellspacing="0"
              cellpadding="0"
              style="
                background:#ffffff;
                border-radius:12px;
                padding:40px;
                box-shadow:0 2px 12px rgba(0,0,0,.08);
              "
            >

              <tr>
                <td align="center">
                  <h1
                    style="
                      margin:0;
                      color:#111827;
                      font-size:28px;
                    "
                  >
                    Invitación a una propiedad
                  </h1>
                </td>
              </tr>

              <tr>
                <td style="padding-top:30px;">
                  <p
                    style="
                      margin:0;
                      color:#374151;
                      font-size:16px;
                      line-height:26px;
                    "
                  >
                    Has sido invitado a formar parte de la propiedad:
                  </p>

                  <p
                    style="
                      margin:18px 0 0;
                      font-size:22px;
                      font-weight:bold;
                      color:#111827;
                    "
                  >
                    ${propertyName}
                  </p>
                </td>
              </tr>

              <tr>
                <td style="padding-top:30px;">
                  <p
                    style="
                      color:#4b5563;
                      font-size:15px;
                      line-height:24px;
                      margin:0;
                    "
                  >
                    Si conoces al propietario y deseas unirte a esta propiedad,
                    haz clic en el botón de abajo para aceptar la invitación.
                  </p>
                </td>
              </tr>

              <tr>
                <td align="center" style="padding:40px 0;">
                  <a
                    href="${ACCEPT_INVITATION_PATH}"
                    style="
                      display:inline-block;
                      background:#000000;
                      color:#ffffff;
                      text-decoration:none;
                      padding:16px 36px;
                      border-radius:8px;
                      font-size:16px;
                      font-weight:bold;
                    "
                  >
                    Aceptar invitación
                  </a>
                </td>
              </tr>

              <tr>
                <td>
                  <p
                    style="
                      margin:0;
                      color:#6b7280;
                      font-size:14px;
                      line-height:22px;
                    "
                  >
                    Por motivos de seguridad, esta invitación tiene una fecha de
                    expiración. Si no reconoces esta invitación, puedes ignorar este
                    correo de forma segura.
                  </p>
                </td>
              </tr>

              <tr>
                <td style="padding-top:32px;">
                  <hr
                    style="
                      border:none;
                      border-top:1px solid #e5e7eb;
                    "
                  />
                </td>
              </tr>

              <tr>
                <td style="padding-top:20px;">
                  <p
                    style="
                      margin:0;
                      color:#9ca3af;
                      font-size:12px;
                      line-height:20px;
                    "
                  >
                    Si el botón no funciona, copia y pega el siguiente enlace en tu navegador:
                  </p>

                  <p
                    style="
                      margin-top:10px;
                      word-break:break-all;
                      font-size:12px;
                      color:#2563eb;
                    "
                  >
                    ${ACCEPT_INVITATION_PATH}
                  </p>
                </td>
              </tr>

            </table>

          </td>
        </tr>
      </table>
    </body>
    </html>
    `;
  const subject = `Has sido invitado a la propiedad ${propertyName}`; //titulo del correo

  if (!ISSUER_EMAIL) {
    throw new Error('not provide a issuer for send the email');
  }

  const { error } = await resendClient.emails.send({
    to,
    from: ISSUER_EMAIL,
    html,
    subject,
  });

  if (error) {
    throw new ResendException(error.message);
  }
}
