import { Injectable } from '@nestjs/common';

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
}
