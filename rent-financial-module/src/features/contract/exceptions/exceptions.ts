import { AppException } from '../../../core/global-exception.js';

export class propertyWithContractAvalibityException extends AppException {
  constructor() {
    super('La propiedad posee un contrato activo!', 406, 'NOT_ACCEPTABLE');
  }
}

export class contractNotFound extends AppException {
  constructor() {
    super('Contrato no encontrado!', 404, 'NOT_FOUND');
  }
}
