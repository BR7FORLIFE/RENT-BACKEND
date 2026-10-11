import { AppException } from '../../../core/global-exception.js';

//catalogo
export class ServiceCatalogNotFound extends AppException {
  constructor() {
    super('Servicio no encontrado!', 404, 'NOT_FOUND');
  }
}

export class ServiceCatalogNameTaken extends AppException {
  constructor() {
    super('Ya existe un servicio con ese nombre!', 409, 'CONFLICT');
  }
}

export class ServiceCatalogAdminRequired extends AppException {
  constructor() {
    super(
      'Solo un administrador autorizado puede administrar el catalogo de servicios!',
      403,
      'FORBIDDEN',
    );
  }
}

export class ServiceCatalogInactive extends AppException {
  constructor() {
    super('El servicio no se encuentra activo!', 406, 'NOT_ACCEPTABLE');
  }
}

//ofertas
export class ServiceOfferingNotFound extends AppException {
  constructor() {
    super('Oferta de servicio no encontrada!', 404, 'NOT_FOUND');
  }
}

export class ServiceOfferingForbidden extends AppException {
  constructor() {
    super(
      'Solo el proveedor de la oferta o un administrador autorizado puede modificarla!',
      403,
      'FORBIDDEN',
    );
  }
}

export class ServiceOfferingMemberInvalid extends AppException {
  constructor() {
    super(
      'El miembro de propiedad indicado no existe o no pertenece al usuario autenticado!',
      403,
      'FORBIDDEN',
    );
  }
}

export class ServiceOfferingInvalid extends AppException {
  constructor(message: string) {
    super(message, 406, 'NOT_ACCEPTABLE');
  }
}

export class ServiceOfferingUnavailable extends AppException {
  constructor(reason: string) {
    super(`La oferta no esta disponible: ${reason}`, 406, 'NOT_ACCEPTABLE');
  }
}

//solicitudes
export class ServiceRequestNotFound extends AppException {
  constructor() {
    super('Solicitud de servicio no encontrada!', 404, 'NOT_FOUND');
  }
}

export class ServiceRequestActorNotAllowed extends AppException {
  constructor(message = 'No puedes realizar esta accion sobre la solicitud!') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class ServiceRequestInvalidTransition extends AppException {
  constructor(from: string, action: string) {
    super(
      `La accion '${action}' no es valida para una solicitud en estado ${from}!`,
      409,
      'CONFLICT',
    );
  }
}

//la solicitud cambio de estado mientras se procesaba la operacion
export class ServiceRequestConcurrentUpdate extends AppException {
  constructor() {
    super(
      'La solicitud fue modificada por otra operacion, vuelve a consultarla!',
      409,
      'CONFLICT',
    );
  }
}

export class ServiceRequestInvalid extends AppException {
  constructor(message: string) {
    super(message, 406, 'NOT_ACCEPTABLE');
  }
}

export class ServiceRequestPriceNotAgreed extends AppException {
  constructor() {
    super(
      'El precio aun no ha sido acordado por ambas partes!',
      406,
      'NOT_ACCEPTABLE',
    );
  }
}
