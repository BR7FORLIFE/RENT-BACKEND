import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { propertyPublicController } from './property-public.controller.js';
import { PropertyMemberService } from './services/property-member.service.js';
import { InvitationLinkedNotFoundException } from './exceptions/exceptions.js';
import { createControllerApp } from '../../../test/helpers.js';

describe('propertyPublicController (HTTP)', () => {
  let app: INestApplication;
  const service = { acceptPropertyMemberInvitation: jest.fn() };

  beforeAll(async () => {
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
    app = await createControllerApp(propertyPublicController, [
      { provide: PropertyMemberService, useValue: service },
    ]);
  });
  afterAll(() => app.close());
  beforeEach(() => service.acceptPropertyMemberInvitation.mockReset());

  it('sin token responde 200 con un mensaje y no llama al servicio', async () => {
    const res = await request(app.getHttpServer())
      .get('/property-process-public/accept-invitation')
      .expect(200);

    expect(res.body.message).toMatch(/token/i);
    expect(service.acceptPropertyMemberInvitation).not.toHaveBeenCalled();
  });

  it('con token acepta la invitación (endpoint público, sin JWT)', async () => {
    service.acceptPropertyMemberInvitation.mockResolvedValue({
      message: 'Invitacion aceptada!',
    });

    const res = await request(app.getHttpServer())
      .get('/property-process-public/accept-invitation?token=abc')
      .expect(200);

    expect(service.acceptPropertyMemberInvitation).toHaveBeenCalledWith('abc');
    expect(res.body).toEqual({ message: 'Invitacion aceptada!' });
  });

  it('token inexistente => 404', async () => {
    service.acceptPropertyMemberInvitation.mockRejectedValue(
      new InvitationLinkedNotFoundException(),
    );

    await request(app.getHttpServer())
      .get('/property-process-public/accept-invitation?token=zzz')
      .expect(404);
  });
});
