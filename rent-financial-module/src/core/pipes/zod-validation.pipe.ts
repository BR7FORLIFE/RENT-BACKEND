import type { PipeTransform } from '@nestjs/common';

import { type ZodSchema } from 'zod';

export class ZodValidation implements PipeTransform {
  constructor(private readonly schema: ZodSchema) {}

  transform(value: unknown) {
    return this.schema.parse(value);
  }
}
