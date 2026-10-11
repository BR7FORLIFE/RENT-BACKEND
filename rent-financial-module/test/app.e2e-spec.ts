import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/core/database/prisma.service.js';
import { GlobalExceptionFilter } from '../src/core/filters/exception.filter.js';
import { TEST_PRIVATE_KEY } from './mocks/env.js';
import { signTestJwt, TEST_USER } from './helpers.js';

/**
 * E2E con la app real (módulos, guards, pipes, filtro) pero sin BD:
 * PrismaService se reemplaza por un mock. Valida autenticación JWT RS256 de punta a punta.
 */
describe('App (e2e, sin base de datos)', () => {
  let app: INestApplication;
  const prismaMock = {
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    $transaction: jest.fn(),
    propertyMember: { findFirst: jest.fn() },
    property: { findMany: jest.fn(), count: jest.fn() },
  };

  beforeAll(async () => {
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue(prismaMock)
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalFilters(new GlobalExceptionFilter());
    app.setGlobalPrefix('rent-financial');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    prismaMock.propertyMember.findFirst.mockReset();
    prismaMock.$transaction.mockReset();
    prismaMock.property.findMany.mockReset();
    prismaMock.property.count.mockReset();
  });

  // BUG conocido: el filtro global transforma el 401 de Passport en 500
  it('sin token => 401', async () => {
    await request(app.getHttpServer())
      .get('/rent-financial/property')
      .expect(401);
  });

  it('token con firma inválida => 401', async () => {
    await request(app.getHttpServer())
      .get('/rent-financial/property')
      .set('Authorization', 'Bearer abc.def.ghi')
      .expect(401);
  });

  it('con token inválido NUNCA se ejecuta lógica de negocio', async () => {
    await request(app.getHttpServer())
      .get('/rent-financial/property')
      .set('Authorization', 'Bearer abc.def.ghi');

    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it('token RS256 válido => accede y la consulta se filtra por el userId del token', async () => {
    prismaMock.$transaction.mockImplementation((ops: Promise<unknown>[]) =>
      Promise.all(ops),
    );
    prismaMock.property.findMany.mockResolvedValue([]);
    prismaMock.property.count.mockResolvedValue(0);
    const token = signTestJwt(TEST_PRIVATE_KEY);

    const res = await request(app.getHttpServer())
      .get('/rent-financial/property')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body).toMatchObject({
      data: [],
      metadata: { total: 0, page: 1 },
    });
    expect(prismaMock.property.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: TEST_USER.userId } }),
    );
  });

  it('token expirado es rechazado (no ejecuta la consulta)', async () => {
    const token = signTestJwt(TEST_PRIVATE_KEY, TEST_USER, -60);

    await request(app.getHttpServer())
      .get('/rent-financial/property')
      .set('Authorization', `Bearer ${token}`);

    expect(prismaMock.property.findMany).not.toHaveBeenCalled();
  });

  it('token firmado con otra llave es rechazado', async () => {
    const { generateKeyPairSync } = await import('node:crypto');
    const other = generateKeyPairSync('rsa', {
      modulusLength: 2048,
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
      publicKeyEncoding: { type: 'spki', format: 'pem' },
    });

    await request(app.getHttpServer())
      .get('/rent-financial/property')
      .set('Authorization', `Bearer ${signTestJwt(other.privateKey)}`);

    expect(prismaMock.property.findMany).not.toHaveBeenCalled();
  });

  it('el endpoint público de invitaciones no requiere JWT', async () => {
    const res = await request(app.getHttpServer())
      .get('/rent-financial/property-process-public/accept-invitation')
      .expect(200);

    expect(res.body.message).toBeDefined();
  });
});
