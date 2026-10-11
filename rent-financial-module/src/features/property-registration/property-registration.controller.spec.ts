import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PropertyRegistrationController } from './property-registration.controller.js';
import { PropertyService } from './services/property.service.js';
import { PropertyNotFoundException } from './exceptions/exceptions.js';
import { createControllerApp, TEST_USER } from '../../../test/helpers.js';
import { CreateSuggestionByPropertyField } from './services/helpers.service.js';

jest.mock('./services/helpers.service.js', () => ({
  CreateSuggestionByPropertyField: jest.fn(),
}));

const validProperty = () => ({
  propertyType: 'RESIDENCIAL',
  propertyOccupationType: 'OCUPADO',
  propertyName: 'Casa Azul',
  propertyDescription: 'desc',
  fmi: 'FMI',
  predialNumber: 'PRE',
  resources: [{ url: 'http://img' }],
  direction: {
    latitute: 4.6,
    longitud: -74.1,
    department: 'Cundinamarca',
    city: 'Bogotá',
    neighborhood: 'Centro',
    typeStreet: 'CALLE',
    numberStreet: 10,
  },
  structurePropertyInfo: {
    bedrooms: '3',
    bathrooms: 2,
    floors: 1,
    parkingSpaces: 0,
    area: 80,
    lotArea: 100,
  },
  economicPropertyInfo: {
    monthlyRent: '1500000',
    depositAmount: 0,
    currency: 'COP',
    utilitiesIncluded: false,
  },
});

describe('PropertyRegistrationController (HTTP)', () => {
  let app: INestApplication;
  const service: Record<string, jest.Mock> = {
    registerProperty: jest.fn(),
    consultAllProperties: jest.fn(),
    consultPropertyById: jest.fn(),
    editingProperty: jest.fn(),
    getAllDocuments: jest.fn(),
    loadDocuments: jest.fn(),
    setPublished: jest.fn(),
    consultPublishedProperties: jest.fn(),
    consultPublishedPropertyById: jest.fn(),
  };

  beforeAll(async () => {
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
    app = await createControllerApp(PropertyRegistrationController, [
      { provide: PropertyService, useValue: service },
    ]);
  });
  afterAll(() => app.close());
  beforeEach(() => {
    Object.values(service).forEach((m) => m.mockReset());
    (CreateSuggestionByPropertyField as jest.Mock).mockReset();
  });

  describe('publicación', () => {
    it('POST :id/publish usa el userId del JWT', async () => {
      service.setPublished.mockResolvedValue({ id: 'p1', isPublished: true });
      await request(app.getHttpServer())
        .post('/property/p1/publish')
        .expect(200);
      expect(service.setPublished).toHaveBeenCalledWith(
        TEST_USER.userId,
        'p1',
        true,
      );
    });

    it('POST :id/unpublish despublica', async () => {
      service.setPublished.mockResolvedValue({ id: 'p1', isPublished: false });
      await request(app.getHttpServer())
        .post('/property/p1/unpublish')
        .expect(200);
      expect(service.setPublished).toHaveBeenCalledWith(
        TEST_USER.userId,
        'p1',
        false,
      );
    });

    it('GET published no es capturado por GET :id', async () => {
      service.consultPublishedProperties.mockResolvedValue({ data: [] });
      await request(app.getHttpServer()).get('/property/published').expect(200);
      expect(service.consultPropertyById).not.toHaveBeenCalled();
    });

    it('GET published/:id devuelve el detalle', async () => {
      service.consultPublishedPropertyById.mockResolvedValue({ id: 'p1' });
      const res = await request(app.getHttpServer())
        .get('/property/published/p1')
        .expect(200);
      expect(res.body).toEqual({ property: { id: 'p1' } });
    });
  });

  describe('POST /property', () => {
    it('201 y coerciona números del DTO', async () => {
      service.registerProperty.mockResolvedValue({ id: 'p1', message: 'ok' });

      const res = await request(app.getHttpServer())
        .post('/property')
        .send(validProperty())
        .expect(201);

      expect(res.body).toEqual({ id: 'p1', message: 'ok' });
      const [userId, dto] = service.registerProperty.mock.calls[0];
      expect(userId).toBe(TEST_USER.userId);
      expect(dto.structurePropertyInfo.bedrooms).toBe(3);
      expect(dto.economicPropertyInfo.monthlyRent).toBe(1500000);
    });

    it('406 si falta la dirección', async () => {
      const { direction: _omit, ...body } = validProperty();
      await request(app.getHttpServer())
        .post('/property')
        .send(body)
        .expect(406);
      expect(service.registerProperty).not.toHaveBeenCalled();
    });

    it('406 con tipo de propiedad inválido', async () => {
      await request(app.getHttpServer())
        .post('/property')
        .send({ ...validProperty(), propertyType: 'CASTILLO' })
        .expect(406);
    });

    it('406 con moneda no soportada', async () => {
      const body = validProperty();
      body.economicPropertyInfo.currency = 'EUR';
      await request(app.getHttpServer())
        .post('/property')
        .send(body)
        .expect(406);
    });
  });

  it('GET /property lista las propiedades del usuario autenticado', async () => {
    service.consultAllProperties.mockResolvedValue({ data: [], metadata: {} });

    await request(app.getHttpServer())
      .get('/property?page=2&limit=5')
      .expect(200);

    expect(service.consultAllProperties).toHaveBeenCalledWith(
      TEST_USER.userId,
      {
        page: 2,
        limit: 5,
      },
    );
  });

  it('GET /property/:id envuelve la respuesta en { property }', async () => {
    service.consultPropertyById.mockResolvedValue({ id: 'p1' });

    const res = await request(app.getHttpServer())
      .get('/property/p1')
      .expect(200);

    expect(res.body).toEqual({ property: { id: 'p1' } });
  });

  it('GET /property/:id traduce PropertyNotFoundException a 404', async () => {
    service.consultPropertyById.mockRejectedValue(
      new PropertyNotFoundException(),
    );
    await request(app.getHttpServer()).get('/property/p1').expect(404);
  });

  describe('PATCH /property/:propertyId', () => {
    // BUG conocido: @UsePipes(ZodValidation(EditingPropertyDtoRequest)) a nivel de método se aplica
    // también a @Param('propertyId'), que es un string => siempre 406. Debe usarse el pipe solo en @Body.
    it('acepta ediciones parciales', async () => {
      service.editingProperty.mockResolvedValue({ id: 'p1', message: 'ok' });

      await request(app.getHttpServer())
        .patch('/property/p1')
        .send({ propertyName: 'Nuevo nombre' })
        .expect(201);

      expect(service.editingProperty).toHaveBeenCalledWith(
        TEST_USER.userId,
        'p1',
        {
          propertyName: 'Nuevo nombre',
        },
      );
    });

    it('rechaza nombres cortos (<8) o largos (>50)', async () => {
      await request(app.getHttpServer())
        .patch('/property/p1')
        .send({ propertyName: 'corto' })
        .expect(406);
      await request(app.getHttpServer())
        .patch('/property/p1')
        .send({ propertyName: 'x'.repeat(51) })
        .expect(406);
    });
  });

  it('POST /property/IA-registration-suggestion devuelve la sugerencia', async () => {
    (CreateSuggestionByPropertyField as jest.Mock).mockResolvedValue({
      name: 'Casa',
      description: 'd',
    });

    const res = await request(app.getHttpServer())
      .post('/property/IA-registration-suggestion')
      .send({ propertyField: 'PropertyName' })
      .expect(200);

    expect(res.body).toEqual({ name: 'Casa', description: 'd' });
  });

  it('GET /property/:id/documentation pagina documentos', async () => {
    service.getAllDocuments.mockResolvedValue({ data: [] });

    await request(app.getHttpServer())
      .get('/property/p1/documentation')
      .expect(200);

    expect(service.getAllDocuments).toHaveBeenCalledWith(
      'p1',
      TEST_USER.userId,
      {
        page: 1,
        limit: 100,
      },
    );
  });

  it('POST /property/:id/documents carga recursos', async () => {
    service.loadDocuments.mockResolvedValue({ propertyId: 'p1' });

    await request(app.getHttpServer())
      .post('/property/p1/documents')
      .send({ resources: [{ url: 'http://doc' }] })
      .expect(201);

    expect(service.loadDocuments).toHaveBeenCalledWith('p1', TEST_USER.userId, [
      { url: 'http://doc' },
    ]);
  });
});
