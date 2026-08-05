import { AppException } from '../../../core/global-exception.js';

export class PropertyAlreadyRegisterException extends AppException {
  constructor() {
    super(
      'La propiedad ya ha sido registrada dentro de la aplicacion!',
      406,
      'NOT_ACCEPTABLE',
    );
  }
}

export class PropertyNotFoundException extends AppException {
  constructor() {
    super('No se ha encontrado propiedad (s)', 404, 'NOT_FOUND');
  }
}

export class PropertyMemberNotFound extends AppException {
  constructor(memberID: string) {
    super(
      `El usuario con ID ${memberID} no se encuentra vinculado al inmueble!`,
      406,
      'NOT_ACCEPTABLE',
    );
  }
}

export class PropertyOccupationTypeNotFoundException extends AppException {
  constructor() {
    super(
      'El tipo de ocupacion del inmueble no se encuentra registrada!',
      404,
      'NOT_FOUND',
    );
  }
}

export class TypePropertyNotFoundException extends AppException {
  constructor() {
    super(
      'El tipo de propiedad del inmueble no se encuentra registrado!',
      404,
      'NOT_FOUND',
    );
  }
}

export class PropertyActorRoleNotFoundException extends AppException {
  constructor() {
    super('El rol no se encuentra registrado!', 404, 'NOT_FOUND');
  }
}

//PropertyMembers
export class InvitationLinkedNotFoundException extends AppException {
  constructor() {
    super('No se encontró enlace de invitacion valido!', 404, 'NOT_FOUND');
  }
}

export class InvitationLinkedStatusNotAllowedException extends AppException {
  constructor() {
    super(
      'El estado actual de la invitacion no permite ejecutar la accion propuesta!',
      406,
      'NOT_ACCEPTABLE',
    );
  }
}

export class InvitationLinkedExpiredException extends AppException {
  constructor() {
    super(
      'La invitacion actual esta expirada, intenta generar uno nuevo',
      406,
      'NOT_ACCEPTABLE',
    );
  }
}

//Error de estado de property Member

export class NotAllowedStatusByPropertyMember extends AppException {
  constructor() {
    super(
      'El miembro actual necesita estar en un proceso para poder realizar ciertas acciones en la app',
      406,
      'NOT_ACCEPTABLE',
    );
  }
}
