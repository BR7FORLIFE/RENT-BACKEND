import { createSign } from 'node:crypto';
import type { CanActivate, ExecutionContext, Type } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { INestApplication, ModuleMetadata } from '@nestjs/common';
import { GlobalExceptionFilter } from '../src/core/filters/exception.filter.js';
import { JwtAuthGuard } from '../src/core/auth/auth.guard.js';

export const TEST_USER = {
  userId: '11111111-1111-4111-8111-111111111111',
  rols: ['USER'],
};

/** Guard falso: inyecta TEST_USER como req.user, o responde 401 con header x-no-auth. */
class FakeJwtGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
    if (req.headers['x-no-auth']) return false;
    req.user = TEST_USER;
    return true;
  }
}

/** Levanta una app Nest solo con el controller y servicios mockeados (sin BD ni JWT reales). */
export async function createControllerApp(
  controller: Type<unknown>,
  providers: ModuleMetadata['providers'],
): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({
    controllers: [controller],
    providers,
  })
    .overrideGuard(JwtAuthGuard)
    .useClass(FakeJwtGuard)
    .compile();

  const app = moduleRef.createNestApplication();
  app.useGlobalFilters(new GlobalExceptionFilter());
  await app.init();
  return app;
}

const b64url = (input: Buffer | string) =>
  Buffer.from(input).toString('base64url');

/** Firma un JWT RS256 con la llave privada efímera de test/mocks/env.ts. */
export function signTestJwt(
  privateKey: string,
  payload: Record<string, unknown> = TEST_USER,
  expiresInSeconds = 300,
) {
  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const body = b64url(
    JSON.stringify({
      ...payload,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + expiresInSeconds,
    }),
  );
  const signature = createSign('RSA-SHA256')
    .update(`${header}.${body}`)
    .sign(privateKey)
    .toString('base64url');
  return `${header}.${body}.${signature}`;
}
