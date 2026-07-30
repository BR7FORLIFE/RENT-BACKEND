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
export async function sendInvitedEmailTo(from: string, to: string) {
  const html = ``;
  const subject = ''; //titulo del correo

  const { error } = await resendClient.emails.send({
    to,
    from,
    html,
    subject,
  });

  if (error) {
    throw new ResendException(error.message);
  }
}
