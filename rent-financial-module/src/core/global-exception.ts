export abstract class AppException extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly error: string,
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class ResendException extends AppException {
  constructor(error: string) {
    super('Servicio de email (RESEND) fallo al enviar el correo!', 503, error);
  }
}

export class UserNotFound extends AppException {
  constructor() {
    super('El usuario no encontrado', 406, 'NOT_ACCEPTABLE');
  }
}
