import { z, ZodError } from 'zod';
import { ZodValidation } from './zod-validation.pipe.js';

describe('ZodValidation pipe', () => {
  const pipe = new ZodValidation(
    z.object({ n: z.coerce.number().int(), name: z.string().default('x') }),
  );

  it('devuelve el valor parseado (coerción y defaults incluidos)', () => {
    expect(pipe.transform({ n: '5' })).toEqual({ n: 5, name: 'x' });
  });

  it('lanza ZodError si el valor no cumple el schema', () => {
    expect(() => pipe.transform({ n: 'abc' })).toThrow(ZodError);
  });

  it('elimina llaves desconocidas (strip por defecto)', () => {
    expect(pipe.transform({ n: 1, extra: true })).toEqual({ n: 1, name: 'x' });
  });
});
