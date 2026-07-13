import { AppException } from '../../../core/global-exception.js';

export class propertyWithContractAvalibityException extends AppException {
  constructor() {
    super('La propiedad posee un contrato activo!', 406, 'NOT_ACCEPTABLE');
  }
}
