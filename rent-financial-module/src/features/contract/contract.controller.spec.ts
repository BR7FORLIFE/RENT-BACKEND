import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { ContractController } from './contract.controller.js';
import { ContractService } from './services/contract.service.js';
import { contractNotFound } from './exceptions/exceptions.js';
import { createControllerApp, TEST_USER } from '../../../test/helpers.js';

const uuid = () => crypto.randomUUID();

describe('ContractController (HTTP)', () => {
  let app: INestApplication;
  const service: Record<string, jest.Mock> = {
    createContract: jest.fn(),
    getAllContracts: jest.fn(),
    getContractbyId: jest.fn(),
    AcceptedOrRejectedContractByTenant: jest.fn(),
    generateContractDraft: jest.fn(),
    getAllContractDraft: jest.fn(),
    getAllAcceptedContracts: jest.fn(),
    getAcceptedContracts: jest.fn(),
    getContractDraftById: jest.fn(),
    agreeContractDraft: jest.fn(),
    loadContractDocumentation: jest.fn(),
    handleContractStatus: jest.fn(),
  };

  beforeAll(async () => {
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
    app = await createControllerApp(ContractController, [
      { provide: ContractService, useValue: service },
    ]);
  });
  afterAll(() => app.close());
  beforeEach(() => Object.values(service).forEach((m) => m.mockReset()));

  // BUG conocido: GlobalExceptionFilter convierte HttpException (403/401 del guard) en 500
  it('un guard que deniega responde 403 (no 500)', async () => {
    await request(app.getHttpServer())
      .get(`/contract/property/${uuid()}`)
      .set('x-no-auth', '1')
      .expect(403);
  });

  describe('POST /contract', () => {
    it('valida el body con Zod (406 ante ids inválidos)', async () => {
      const res = await request(app.getHttpServer())
        .post('/contract')
        .send({ propertyId: 'x' })
        .expect(406);

      expect(res.body.message).toMatch(/estructura esperada/);
      expect(service.createContract).not.toHaveBeenCalled();
    });

    it('usa el userId del JWT (nunca del body) y responde id+message', async () => {
      service.createContract.mockResolvedValue({
        id: 'c1',
        message: 'ok',
        extra: 'no',
      });
      const body = {
        propertyId: uuid(),
        landlordMemberId: uuid(),
        tenantMemberId: uuid(),
      };

      const res = await request(app.getHttpServer())
        .post('/contract')
        .send(body)
        .expect(201);

      expect(service.createContract).toHaveBeenCalledWith(
        TEST_USER.userId,
        body,
      );
      expect(res.body).toEqual({ id: 'c1', message: 'ok' });
    });
  });

  describe('GET /contract/property/:propertyId', () => {
    it('pasa paginación con defaults', async () => {
      service.getAllContracts.mockResolvedValue({ data: [] });
      const propertyId = uuid();

      await request(app.getHttpServer())
        .get(`/contract/property/${propertyId}`)
        .expect(200);

      expect(service.getAllContracts).toHaveBeenCalledWith(
        TEST_USER.userId,
        propertyId,
        {
          page: 1,
          limit: 100,
        },
      );
    });

    it('rechaza limit fuera de rango', async () => {
      await request(app.getHttpServer())
        .get(`/contract/property/${uuid()}?limit=1000`)
        .expect(406);
    });
  });

  it('GET /contract/:contractId/property/:propertyId delega con (user, property, contract)', async () => {
    service.getContractbyId.mockResolvedValue({ id: 'c1' });

    await request(app.getHttpServer())
      .get('/contract/c1/property/p1')
      .expect(200);

    expect(service.getContractbyId).toHaveBeenCalledWith(
      TEST_USER.userId,
      'p1',
      'c1',
    );
  });

  it('traduce AppException del servicio a su status HTTP', async () => {
    service.getContractbyId.mockRejectedValue(new contractNotFound());

    const res = await request(app.getHttpServer())
      .get('/contract/c1/property/p1')
      .expect(404);

    expect(res.body).toMatchObject({
      error: 'NOT_FOUND',
      path: '/contract/c1/property/p1',
    });
  });

  it('POST /contract/acceptedOrRejected valida el enum de estado', async () => {
    await request(app.getHttpServer())
      .post('/contract/acceptedOrRejected')
      .send({ contractId: uuid(), propertyId: uuid(), status: 'MAYBE' })
      .expect(406);
  });

  it('POST /contract/acceptedOrRejected delega (contract, property, user, status)', async () => {
    service.AcceptedOrRejectedContractByTenant.mockResolvedValue({
      contractId: 'c1',
    });
    const body = { contractId: uuid(), propertyId: uuid(), status: 'ACCEPTED' };

    await request(app.getHttpServer())
      .post('/contract/acceptedOrRejected')
      .send(body)
      .expect(201);

    expect(service.AcceptedOrRejectedContractByTenant).toHaveBeenCalledWith(
      body.contractId,
      body.propertyId,
      TEST_USER.userId,
      'ACCEPTED',
    );
  });

  describe('borradores', () => {
    it('POST /contract/draft coerciona fechas y montos', async () => {
      service.generateContractDraft.mockResolvedValue({ id: 'd1' });
      const body = {
        content: 'texto',
        propertyId: uuid(),
        landlordMemberId: uuid(),
        tenantMemberId: uuid(),
        monthlyRent: '1000',
        depositAmount: '0',
        startDate: '2026-01-01',
        endDate: '2027-01-01',
      };

      await request(app.getHttpServer())
        .post('/contract/draft')
        .send(body)
        .expect(201);

      const [userId, dto] = service.generateContractDraft.mock.calls[0];
      expect(userId).toBe(TEST_USER.userId);
      expect(dto.monthlyRent).toBe(1000);
      expect(dto.startDate).toBeInstanceOf(Date);
    });

    it('GET /contract/draft/property/:id/getall', async () => {
      service.getAllContractDraft.mockResolvedValue({ data: [] });
      await request(app.getHttpServer())
        .get('/contract/draft/property/p1/getall?page=2&limit=5')
        .expect(200);
      expect(service.getAllContractDraft).toHaveBeenCalledWith(
        TEST_USER.userId,
        'p1',
        {
          page: 2,
          limit: 5,
        },
      );
    });

    it('GET /contract/draft/getAcceptedContracts/property/:id', async () => {
      service.getAllAcceptedContracts.mockResolvedValue({ data: [] });
      await request(app.getHttpServer())
        .get('/contract/draft/getAcceptedContracts/property/p1')
        .expect(200);
      expect(service.getAllAcceptedContracts).toHaveBeenCalled();
    });

    it('GET .../property/:propertyId/id/:contractDraftId', async () => {
      service.getAcceptedContracts.mockResolvedValue({ id: 'd1' });
      await request(app.getHttpServer())
        .get('/contract/draft/getAcceptedContracts/property/p1/id/d1')
        .expect(200);
      expect(service.getAcceptedContracts).toHaveBeenCalledWith(
        TEST_USER.userId,
        'p1',
        'd1',
      );
    });

    it('GET /contract/draft/:draftId/property/:propertyId', async () => {
      service.getContractDraftById.mockResolvedValue({ id: 'd1' });
      await request(app.getHttpServer())
        .get('/contract/draft/d1/property/p1')
        .expect(200);
      expect(service.getContractDraftById).toHaveBeenCalledWith(
        TEST_USER.userId,
        'd1',
        'p1',
      );
    });

    it('POST /contract/draft/:id/agree usa propertyId del body', async () => {
      service.agreeContractDraft.mockResolvedValue({ contractDraftId: 'd1' });
      const propertyId = uuid();

      await request(app.getHttpServer())
        .post('/contract/draft/d1/agree')
        .send({ propertyId })
        .expect(201);

      expect(service.agreeContractDraft).toHaveBeenCalledWith(
        TEST_USER.userId,
        propertyId,
        'd1',
      );
    });
  });

  it('POST /contract/:id/documents valida y delega los recursos', async () => {
    service.loadContractDocumentation.mockResolvedValue({ contractId: 'c1' });
    const propertyId = uuid();

    await request(app.getHttpServer())
      .post('/contract/c1/documents')
      .send({ propertyId, resources: [{ url: 'http://doc' }] })
      .expect(201);

    expect(service.loadContractDocumentation).toHaveBeenCalledWith(
      TEST_USER.userId,
      propertyId,
      'c1',
      [{ url: 'http://doc' }],
    );
  });

  describe('PATCH /contract/:id/property/:id/status', () => {
    it('acepta SUSPENDED/FINISHED', async () => {
      service.handleContractStatus.mockResolvedValue({ contractId: 'c1' });

      await request(app.getHttpServer())
        .patch('/contract/c1/property/p1/status')
        .send({ status: 'SUSPENDED' })
        .expect(200);

      expect(service.handleContractStatus).toHaveBeenCalledWith(
        TEST_USER.userId,
        'c1',
        { status: 'SUSPENDED' },
        'p1',
      );
    });

    it('rechaza estados no permitidos (ACTIVO)', async () => {
      await request(app.getHttpServer())
        .patch('/contract/c1/property/p1/status')
        .send({ status: 'ACTIVO' })
        .expect(406);
    });
  });
});
