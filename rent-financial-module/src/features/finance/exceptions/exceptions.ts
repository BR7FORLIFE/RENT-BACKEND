import { AppException } from '../../../core/global-exception.js';

export class FinancialTransactionNotFound extends AppException {
  constructor() {
    super('Movimiento financiero no encontrado!', 404, 'NOT_FOUND');
  }
}

export class FinancePropertyNotFound extends AppException {
  constructor() {
    super('Inmueble no encontrado!', 404, 'NOT_FOUND');
  }
}

export class FinanceContractNotFound extends AppException {
  constructor() {
    super('Contrato no encontrado!', 404, 'NOT_FOUND');
  }
}

export class FinanceContractPropertyMismatch extends AppException {
  constructor() {
    super(
      'El contrato no pertenece al inmueble indicado!',
      406,
      'NOT_ACCEPTABLE',
    );
  }
}

export class FinancialTransactionImmutable extends AppException {
  constructor() {
    super(
      'Los movimientos pagados o cancelados no pueden modificarse!',
      409,
      'CONFLICT',
    );
  }
}

export class FinancialTransactionInvalidTransition extends AppException {
  constructor(from: string, to: string) {
    super(
      `Transicion de estado no permitida: ${from} -> ${to}!`,
      409,
      'CONFLICT',
    );
  }
}

export class FinancialTransactionConcurrentUpdate extends AppException {
  constructor() {
    super(
      'El movimiento fue modificado por otra operacion, intenta nuevamente!',
      409,
      'CONFLICT',
    );
  }
}

export class FinancialInvalidData extends AppException {
  constructor(message: string) {
    super(message, 406, 'NOT_ACCEPTABLE');
  }
}
