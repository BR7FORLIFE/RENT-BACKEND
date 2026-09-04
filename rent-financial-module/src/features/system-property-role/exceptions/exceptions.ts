import { AppException } from '../../../core/global-exception.js';

//miembro de la propiedad no encontrado
export class PropertyMemberNotFound extends AppException {
  constructor(memberID: string) {
    super(
      `El usuario con ID ${memberID} no se encuentra vinculado al inmueble!`,
      406,
      'NOT_ACCEPTABLE',
    );
  }
}

export class PropertyMemberNotFoundById extends AppException {
  constructor(propertyMemberId: string) {
    super(
      `El usuario con ID de miembro de propiedad ${propertyMemberId} no se encuentra vinculado al inmueble!`,
      406,
      'NOT_ACCEPTABLE',
    );
  }
}

//roles que no se encuentra dentro de la app
export class PropertyActorRoleNotFoundException extends AppException {
  constructor() {
    super('El rol no se encuentra registrado!', 404, 'NOT_FOUND');
  }
}

//Error de estado de property Member
export class NotAllowedStatusByPropertyMemberException extends AppException {
  constructor() {
    super(
      'El miembro actual necesita estar en un estado activo para poder realizar ciertas acciones en la app',
      406,
      'NOT_ACCEPTABLE',
    );
  }
}

//no se permite asignar un rol si dicho usuario ya lo posee
export class AssingnmentStatusNotAllowedException extends AppException {
  constructor() {
    super(
      'No se permite asignar los estados actuales dado que el miembro ya los posee',
      406,
      'NOT_ACCEPTABLE',
    );
  }
}

//excepciones para las politicas
export class PoliciesNotFoundException extends AppException {
  constructor() {
    super(
      'Las politicas para el miembro actual no se encontraron!',
      404,
      'NOT_FOUND',
    );
  }
}

export class PoliciesAuthorizationNotAllowed extends AppException {
  constructor() {
    super(
      'Acceso denegado!, no cuenta con las politicas necesario para realizar la acción',
      401,
      'Unauthorized',
    );
  }
}
