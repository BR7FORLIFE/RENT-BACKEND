import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PropertyMemberController } from './property-member.controller.js';
import { PropertyMemberService } from './services/property-member.service.js';
import { createControllerApp, TEST_USER } from '../../../test/helpers.js';

const uuid = () => crypto.randomUUID();

describe('PropertyMemberController (HTTP)', () => {
  let app: INestApplication;
  const service: Record<string, jest.Mock> = {
    invitePropertyMembers: jest.fn(),
    getAllPropertiesByPropertyMemberId: jest.fn(),
    getPropertyByPropertyMemberId: jest.fn(),
    getAllPropertyMemberByPropertyId: jest.fn(),
    getPropertyMemberByIdAndPropertyId: jest.fn(),
    assignmentRolesToMember: jest.fn(),
    propertyMemberMe: jest.fn(),
    changeStatusPropertyMember: jest.fn(),
  };

  beforeAll(async () => {
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
    app = await createControllerApp(PropertyMemberController, [
      { provide: PropertyMemberService, useValue: service },
    ]);
  });
  afterAll(() => app.close());
  beforeEach(() => Object.values(service).forEach((m) => m.mockReset()));

  describe('POST /property-member/invite-property-member', () => {
    it('valida email y UUIDs', async () => {
      await request(app.getHttpServer())
        .post('/property-member/invite-property-member')
        .send({ email: 'no-email', propertyId: uuid() })
        .expect(406);
    });

    it('delega el body completo y responde id, invitedEmailTo y message', async () => {
      service.invitePropertyMembers.mockResolvedValue({
        id: 'i1',
        invitedEmailTo: 'a@b.co',
        message: 'ok',
        secret: 'x',
      });
      const body = { email: 'a@b.co', propertyId: uuid() };

      const res = await request(app.getHttpServer())
        .post('/property-member/invite-property-member')
        .send(body)
        .expect(201);

      expect(service.invitePropertyMembers).toHaveBeenCalledWith(
        TEST_USER.userId,
        body,
      );
      expect(res.body).toEqual({
        id: 'i1',
        invitedEmailTo: 'a@b.co',
        message: 'ok',
      });
    });

    // regresión B3: un userId enviado en el body no suplanta al propietario
    it('usa el userId del JWT e ignora el enviado en el body', async () => {
      service.invitePropertyMembers.mockResolvedValue({});
      const body = {
        userId: uuid(),
        email: 'a@b.co',
        propertyId: uuid(),
      };

      await request(app.getHttpServer())
        .post('/property-member/invite-property-member')
        .send(body)
        .expect(201);

      const [ownerId, dto] = service.invitePropertyMembers.mock.calls[0];
      expect(ownerId).toBe(TEST_USER.userId);
      expect(dto).not.toHaveProperty('userId');
    });
  });

  describe('GET /property-member/properties', () => {
    it('exige status ACTIVE|IN_PROCESS', async () => {
      await request(app.getHttpServer())
        .get('/property-member/properties?status=DESACTIVE')
        .expect(406);
    });

    it('delega filtro y paginación con el userId del JWT', async () => {
      service.getAllPropertiesByPropertyMemberId.mockResolvedValue({
        data: [],
      });

      await request(app.getHttpServer())
        .get('/property-member/properties?status=ACTIVE')
        .expect(200);

      expect(service.getAllPropertiesByPropertyMemberId).toHaveBeenCalledWith(
        TEST_USER.userId,
        { status: 'ACTIVE' },
        { page: 1, limit: 100 },
      );
    });
  });

  it('GET /property-member/property/:propertyId', async () => {
    service.getPropertyByPropertyMemberId.mockResolvedValue({
      propertyName: 'n',
    });
    await request(app.getHttpServer())
      .get('/property-member/property/p1')
      .expect(200);
    expect(service.getPropertyByPropertyMemberId).toHaveBeenCalledWith(
      TEST_USER.userId,
      'p1',
    );
  });

  it('GET /property-member/property/:propertyId/getall valida status', async () => {
    await request(app.getHttpServer())
      .get('/property-member/property/p1/getall?status=OTRO')
      .expect(406);

    service.getAllPropertyMemberByPropertyId.mockResolvedValue({ data: [] });
    await request(app.getHttpServer())
      .get('/property-member/property/p1/getall?status=DESACTIVE')
      .expect(200);
    expect(service.getAllPropertyMemberByPropertyId).toHaveBeenCalledWith(
      TEST_USER.userId,
      'p1',
      'DESACTIVE',
      { page: 1, limit: 100 },
    );
  });

  it('GET /property-member/:memberId/property/:propertyId/get', async () => {
    service.getPropertyMemberByIdAndPropertyId.mockResolvedValue({ id: 'm1' });
    await request(app.getHttpServer())
      .get('/property-member/m1/property/p1/get')
      .expect(200);
    expect(service.getPropertyMemberByIdAndPropertyId).toHaveBeenCalledWith(
      TEST_USER.userId,
      'm1',
      'p1',
    );
  });

  describe('POST /property-member/:propertyMemberId (asignar roles)', () => {
    it('rechaza roles que no existen en el catálogo', async () => {
      await request(app.getHttpServer())
        .post('/property-member/m1')
        .send({ propertyId: uuid(), roles: ['SUPERADMIN'] })
        .expect(406);
    });

    it('delega roles válidos', async () => {
      service.assignmentRolesToMember.mockResolvedValue({ message: 'ok' });
      const propertyId = uuid();

      await request(app.getHttpServer())
        .post('/property-member/m1')
        .send({ propertyId, roles: ['INVITADO', 'FAMILIAR'] })
        .expect(201);

      expect(service.assignmentRolesToMember).toHaveBeenCalledWith(
        TEST_USER.userId,
        'm1',
        propertyId,
        ['INVITADO', 'FAMILIAR'],
      );
    });
  });

  it('GET /property-member/:propertyId/me', async () => {
    service.propertyMemberMe.mockResolvedValue({ roles: [] });
    await request(app.getHttpServer())
      .get('/property-member/p1/me')
      .expect(200);
    expect(service.propertyMemberMe).toHaveBeenCalledWith(
      'p1',
      TEST_USER.userId,
    );
  });

  describe('POST /property-member/:id/status', () => {
    it('valida estado y propertyId', async () => {
      await request(app.getHttpServer())
        .post('/property-member/m1/status')
        .send({ status: 'BANNED', propertyId: uuid() })
        .expect(406);
    });

    it('delega el cambio de estado', async () => {
      service.changeStatusPropertyMember.mockResolvedValue({ message: 'ok' });
      const body = { status: 'DESACTIVE', propertyId: uuid() };

      await request(app.getHttpServer())
        .post('/property-member/m1/status')
        .send(body)
        .expect(201);

      expect(service.changeStatusPropertyMember).toHaveBeenCalledWith(
        TEST_USER.userId,
        'm1',
        body,
      );
    });
  });
});
