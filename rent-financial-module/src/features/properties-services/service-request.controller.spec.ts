import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { ServiceRequestController } from './service-request.controller.js';
import { ServiceRequestService } from './services/service-request.service.js';
import { ServiceCatalogController } from './service-catalog.controller.js';
import { ServiceCatalogService } from './services/service-catalog.service.js';
import { ServiceOfferingController } from './service-offering.controller.js';
import { ServiceOfferingService } from './services/service-offering.service.js';
import {
  ServiceCatalogAdminRequired,
  ServiceRequestInvalidTransition,
} from './exceptions/exceptions.js';
import { createControllerApp, TEST_USER } from '../../../test/helpers.js';

const uuid = () => crypto.randomUUID();

describe('ServiceRequestController (HTTP)', () => {
  let app: INestApplication;
  const service: Record<string, jest.Mock> = {
    create: jest.fn(),
    findAccessible: jest.fn(),
    findMine: jest.fn(),
    findReceived: jest.fn(),
    findByProperty: jest.fn(),
    findById: jest.fn(),
    accept: jest.fn(),
    reject: jest.fn(),
    start: jest.fn(),
    complete: jest.fn(),
    cancel: jest.fn(),
    proposePrice: jest.fn(),
    acceptPrice: jest.fn(),
  };

  beforeAll(async () => {
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
    app = await createControllerApp(ServiceRequestController, [
      { provide: ServiceRequestService, useValue: service },
    ]);
  });
  afterAll(() => app.close());
  beforeEach(() => Object.values(service).forEach((m) => m.mockReset()));

  it('POST / valida el body (406) y rechaza campos sensibles', async () => {
    await request(app.getHttpServer())
      .post('/service-requests')
      .send({
        serviceOfferingId: uuid(),
        propertyId: uuid(),
        status: 'COMPLETED',
      })
      .expect(406);
    expect(service.create).not.toHaveBeenCalled();
  });

  it('POST / crea usando el usuario del JWT', async () => {
    service.create.mockResolvedValue({ id: 'r1' });
    const body = { serviceOfferingId: uuid(), propertyId: uuid() };
    await request(app.getHttpServer())
      .post('/service-requests')
      .send(body)
      .expect(201);
    expect(service.create).toHaveBeenCalledWith(TEST_USER, body);
  });

  it.each([
    ['mine', 'findMine'],
    ['provider/mine', 'findReceived'],
  ])(
    'GET /%s no se confunde con :id y usa el usuario autenticado',
    async (path, method) => {
      service[method].mockResolvedValue({ data: [] });
      await request(app.getHttpServer())
        .get(`/service-requests/${path}`)
        .expect(200);
      expect(service[method]).toHaveBeenCalledWith(
        TEST_USER,
        expect.objectContaining({ page: 1, limit: 100 }),
      );
      expect(service.findById).not.toHaveBeenCalled();
    },
  );

  it('GET /:id rechaza ids no UUID', async () => {
    await request(app.getHttpServer()).get('/service-requests/abc').expect(400);
  });

  it.each(['accept', 'reject', 'start', 'complete', 'cancel'])(
    'POST /:id/%s delega con el usuario del JWT',
    async (action) => {
      service[action].mockResolvedValue({ id: 'r1' });
      const id = uuid();
      await request(app.getHttpServer())
        .post(`/service-requests/${id}/${action}`)
        .send({ reason: 'x' })
        .expect(200);
      expect(service[action]).toHaveBeenCalledWith(TEST_USER, id, {
        reason: 'x',
      });
    },
  );

  it('una transicion invalida responde 409 con el mensaje', async () => {
    service.accept.mockRejectedValue(
      new ServiceRequestInvalidTransition('COMPLETED', 'accept'),
    );
    const res = await request(app.getHttpServer())
      .post(`/service-requests/${uuid()}/accept`)
      .send({})
      .expect(409);
    expect(res.body.message).toMatch(/COMPLETED/);
  });

  it('negociacion: propose valida el precio; accept no recibe body', async () => {
    const id = uuid();
    await request(app.getHttpServer())
      .post(`/service-requests/${id}/price/propose`)
      .send({ price: -1 })
      .expect(406);
    service.proposePrice.mockResolvedValue({});
    await request(app.getHttpServer())
      .post(`/service-requests/${id}/price/propose`)
      .send({ price: '1500.50' })
      .expect(200);
    expect(service.proposePrice).toHaveBeenCalledWith(TEST_USER, id, {
      price: '1500.50',
    });
    service.acceptPrice.mockResolvedValue({});
    await request(app.getHttpServer())
      .post(`/service-requests/${id}/price/accept`)
      .expect(200);
  });
});

describe('ServiceCatalogController / ServiceOfferingController (HTTP)', () => {
  let catalogApp: INestApplication;
  let offeringApp: INestApplication;
  const catalog: Record<string, jest.Mock> = {
    findAll: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    changeStatus: jest.fn(),
  };
  const offerings: Record<string, jest.Mock> = {
    findAll: jest.fn(),
    findMine: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    changeStatus: jest.fn(),
  };

  beforeAll(async () => {
    catalogApp = await createControllerApp(ServiceCatalogController, [
      { provide: ServiceCatalogService, useValue: catalog },
    ]);
    offeringApp = await createControllerApp(ServiceOfferingController, [
      { provide: ServiceOfferingService, useValue: offerings },
    ]);
  });
  afterAll(async () => {
    await catalogApp.close();
    await offeringApp.close();
  });

  it('POST /services con un no administrador => 403', async () => {
    catalog.create.mockRejectedValue(new ServiceCatalogAdminRequired());
    await request(catalogApp.getHttpServer())
      .post('/services')
      .send({ name: 'Plomeria', description: 'Tuberias' })
      .expect(403);
  });

  it('PATCH /services/:id/status valida isActive', async () => {
    await request(catalogApp.getHttpServer())
      .patch(`/services/${uuid()}/status`)
      .send({ isActive: 'x' })
      .expect(406);
  });

  it('GET /service-offerings/mine se resuelve antes que :id', async () => {
    offerings.findMine.mockResolvedValue({ data: [] });
    await request(offeringApp.getHttpServer())
      .get('/service-offerings/mine')
      .expect(200);
    expect(offerings.findById).not.toHaveBeenCalled();
  });

  it('POST /service-offerings ignora/rechaza providerUserId del cliente', async () => {
    await request(offeringApp.getHttpServer())
      .post('/service-offerings')
      .send({
        serviceId: uuid(),
        scope: 'PUBLIC',
        priceTypeAgreement: 'FIXED',
        basePrice: 10,
        currency: 'COP',
        providerUserId: uuid(),
      })
      .expect(406);
    expect(offerings.create).not.toHaveBeenCalled();
  });
});
