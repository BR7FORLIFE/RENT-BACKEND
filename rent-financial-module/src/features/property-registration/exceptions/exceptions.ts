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
