import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { FinanceController } from './finance.controller.js';
import { FinanceService } from './services/finance.service.js';
import { FinancialTransactionImmutable } from './exceptions/exceptions.js';
import { createControllerApp, TEST_USER } from '../../../test/helpers.js';

const uuid = () => crypto.randomUUID();

describe('FinanceController (HTTP)', () => {
  let app: INestApplication;
  const service: Record<string, jest.Mock> = {
    create: jest.fn(),
    findAll: jest.fn(),
    findHistory: jest.fn(),
    getSummary: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    changeStatus: jest.fn(),
    markAsPaid: jest.fn(),
  };
  const propertyId = uuid();
  const base = `/finance/property/${propertyId}`;

  beforeAll(async () => {
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
    app = await createControllerApp(FinanceController, [
      { provide: FinanceService, useValue: service },
    ]);
  });
  afterAll(() => app.close());
  beforeEach(() => Object.values(service).forEach((m) => m.mockReset()));

  it('rechaza propertyId que no es UUID (400) sin llamar al servicio', async () => {
    await request(app.getHttpServer())
      .get('/finance/property/abc/transactions')
      .expect(400);
    expect(service.findAll).not.toHaveBeenCalled();
  });

  it('POST valida el body (406)', async () => {
    await request(app.getHttpServer())
      .post(`${base}/transactions`)
      .send({ type: 'INCOME', amount: -1 })
      .expect(406);
    expect(service.create).not.toHaveBeenCalled();
  });

  it('POST crea usando el usuario del JWT', async () => {
    service.create.mockResolvedValue({ id: 't1' });
    await request(app.getHttpServer())
      .post(`${base}/transactions`)
      .send({
        type: 'EXPENSE',
        category: 'MAINTENANCE',
        description: 'Arreglo',
        amount: '50.5',
        currency: 'USD',
      })
      .expect(201);
    expect(service.create).toHaveBeenCalledWith(
      TEST_USER,
      propertyId,
      expect.objectContaining({ amount: '50.5', status: 'PENDING' }),
    );
  });

  it('GET lista valida filtros y rango de fechas', async () => {
    await request(app.getHttpServer())
      .get(`${base}/transactions?from=2026-12-01&to=2026-01-01`)
      .expect(406);
    service.findAll.mockResolvedValue({ data: [] });
    await request(app.getHttpServer())
      .get(`${base}/transactions?type=INCOME&status=PAID`)
      .expect(200);
    expect(service.findAll).toHaveBeenCalledWith(
      TEST_USER,
      propertyId,
      expect.objectContaining({ type: 'INCOME', status: 'PAID' }),
    );
  });

  it('GET summary exige from y to', async () => {
    await request(app.getHttpServer()).get(`${base}/summary`).expect(406);
    service.getSummary.mockResolvedValue({ byCurrency: [] });
    await request(app.getHttpServer())
      .get(`${base}/summary?from=2026-01-01&to=2026-02-01`)
      .expect(200);
  });

  it('GET history y GET por id delegan al servicio', async () => {
    service.findHistory.mockResolvedValue({ data: [] });
    service.findById.mockResolvedValue({ id: 't1' });
    await request(app.getHttpServer()).get(`${base}/history`).expect(200);
    const id = uuid();
    await request(app.getHttpServer())
      .get(`${base}/transactions/${id}`)
      .expect(200);
    expect(service.findById).toHaveBeenCalledWith(TEST_USER, propertyId, id);
  });

  it('PATCH no permite cambiar el estado por la ruta de edicion', async () => {
    await request(app.getHttpServer())
      .patch(`${base}/transactions/${uuid()}`)
      .send({ status: 'PAID' })
      .expect(406);
    expect(service.update).not.toHaveBeenCalled();
  });

  it('POST pay y PATCH status delegan y propagan 409 de inmutables', async () => {
    const id = uuid();
    service.markAsPaid.mockResolvedValue({ id, status: 'PAID' });
    await request(app.getHttpServer())
      .post(`${base}/transactions/${id}/pay`)
      .send({})
      .expect(201);

    service.changeStatus.mockRejectedValue(new FinancialTransactionImmutable());
    await request(app.getHttpServer())
      .patch(`${base}/transactions/${id}/status`)
      .send({ status: 'PENDING' })
      .expect(409);
  });
});
