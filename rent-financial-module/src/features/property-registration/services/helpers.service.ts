import { Injectable } from '@nestjs/common';
import type { PropertyActorRoleType } from '../types.js';
import { ActorRoleException } from '../exceptions/domain-exceptions.js';

@Injectable()
export class PropertyHelper {
  cleanUndefined<T extends object>(obj: T): Partial<T> {
    return Object.entries(obj).reduce((acc, [key, value]) => {
      if (value !== undefined) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        acc[key as keyof T] = value;
      }

      return acc;
    }, {} as Partial<T>);
  }

  IsActorRole(
    expected: PropertyActorRoleType,
    current: PropertyActorRoleType[],
    compare: boolean = true,
  ) {
    if (compare) {
      if (!current.includes(expected)) {
        throw new ActorRoleException(
          `Se esperaba un actor role ${expected} pero a cambio se recibio otro rol`,
        );
      }
    } else {
      if (current.includes(expected)) {
        throw new ActorRoleException(
          `Verifica el rol ${expected} antes de realizar la acción`,
        );
      }
    }
  }
}
