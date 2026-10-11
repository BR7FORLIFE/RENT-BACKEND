// Stub del cliente generado de Prisma para Jest (el original usa import.meta y no corre en CJS).
export class PrismaClient {
  constructor(..._args: unknown[]) {}
  $connect = jest.fn();
  $disconnect = jest.fn();
}

class Decimal {
  constructor(private readonly value: number | string) {}
  toNumber() {
    return Number(this.value);
  }
  toString() {
    return String(this.value);
  }
}

export const Prisma = { Decimal };
