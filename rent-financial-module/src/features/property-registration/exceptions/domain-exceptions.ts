import { AppException } from '../../../core/global-exception.js';

export class ActorRoleException extends AppException {
  constructor(message: string) {
    super(message, 406, 'NOT_ACCEPTABLE');
  }
}
