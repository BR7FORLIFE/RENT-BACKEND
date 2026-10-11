import { PropertyMemberService } from './property-member.service.js';
import {
  InvitationLinkedExpiredException,
  InvitationLinkedNotFoundException,
  InvitationLinkedStatusNotAllowedException,
  PropertyNotFoundException,
} from '../exceptions/exceptions.js';
import {
  AssingnmentStatusNotAllowedException,
  ChangeStatusPropertyMemberException,
  NotAllowedStatusByPropertyMemberException,
  PropertyMemberNotFound,
} from '../../system-property-role/exceptions/exceptions.js';
import { UserNotFound } from '../../../core/global-exception.js';
import { getAllUsers, getUserData } from '../api.js';
import {
  generateSecureString,
  sendInvitedEmailTo,
} from './invitation-generation.service.js';
import { TYPE_PROPERTY_ACTOR_ROLE_UUIDS } from '../../../types/global-types.js';

jest.mock('../api.js', () => ({
  getUserData: jest.fn(),
  getAllUsers: jest.fn(),
}));
jest.mock('./invitation-generation.service.js', () => ({
  generateSecureString: jest.fn(),
  sendInvitedEmailTo: jest.fn(),
}));

describe('PropertyMemberService', () => {
  const tx = { __tx: true };
  const prisma = { $transaction: jest.fn() };
  const propertyMemberRepository = {
    findAll: jest.fn(),
    findPropertyMemberByIdAndPropertyId: jest.fn(),
    savePropertyMember: jest.fn(),
    savePropertyMemberRole: jest.fn(),
    savePropertyMemberWithRoles: jest.fn(),
    findPropertyMemberWithRolesByPropertyMemberIdAndPropertyId: jest.fn(),
    updatePropertyMemberStatus: jest.fn(),
    findPropertyMemberByUserIdAndPropertyId: jest.fn(),
  };
  const propertyRepository = {
    findPropertyById: jest.fn(),
    findAllPartialPropertyInfoByPropertyMemberId: jest.fn(),
    findPartialPropertyInfoByPropertyMemberId: jest.fn(),
  };
  const systemPropertyRepository = {
    findAllPoliciesByPropertyMemberId: jest.fn(),
    findActorRolesByPropertyMemberId: jest.fn(),
    findOverridePolicyByPropertyMemberId: jest.fn(),
  };
  const systemRole = {
    verifyPropertyMemberByIdAndPropertyIdWithoutStatus: jest.fn(),
  };
  const globalRepository = {
    saveInvitationLinked: jest.fn(),
    findPropertyInvitationByToken: jest.fn(),
    markInvitationAsConsumed: jest.fn(),
  };

  let service: PropertyMemberService;

  beforeEach(() => {
    jest.resetAllMocks();
    (sendInvitedEmailTo as jest.Mock).mockResolvedValue(undefined);
    (generateSecureString as jest.Mock).mockReturnValue('TOKEN-20-CHARS');
    prisma.$transaction.mockImplementation((cb: (t: unknown) => unknown) =>
      cb(tx),
    );
    service = new PropertyMemberService(
      prisma as never,
      propertyMemberRepository as never,
      propertyRepository as never,
      systemPropertyRepository as never,
      systemRole as never,
      globalRepository as never,
    );
  });

  describe('getAllPropertyMemberByPropertyId', () => {
    it('solo el propietario puede listar miembros', async () => {
      propertyRepository.findPropertyById.mockResolvedValue(null);

      await expect(
        service.getAllPropertyMemberByPropertyId('u1', 'p1', 'ACTIVE', {
          page: 1,
          limit: 10,
        }),
      ).rejects.toBeInstanceOf(PropertyNotFoundException);
      expect(propertyRepository.findPropertyById).toHaveBeenCalledWith(
        'u1',
        'p1',
      );
    });

    it('limpia políticas con overrides y las une con datos del microservicio de auth', async () => {
      propertyRepository.findPropertyById.mockResolvedValue({ id: 'p1' });
      propertyMemberRepository.findAll.mockResolvedValue({
        data: [
          {
            id: 'm1',
            userId: 'u2',
            status: 'ACTIVE',
            assignedAt: new Date(),
            roles: ['MIEMBRO'],
            policies: ['A', 'B', 'A'],
            overrides: ['B'],
          },
        ],
        metadata: { total: 1 },
      });
      (getAllUsers as jest.Mock).mockResolvedValue([
        { userId: 'u2', fullname: 'Ana' },
      ]);

      const res = await service.getAllPropertyMemberByPropertyId(
        'u1',
        'p1',
        'ACTIVE',
        {
          page: 1,
          limit: 10,
        },
      );

      expect(getAllUsers).toHaveBeenCalledWith(['u2']);
      expect(res.metadata).toEqual({ total: 1 });
      expect(res.data[0]).toMatchObject({
        id: 'm1',
        fullname: 'Ana',
        policies: ['A'],
      });
    });
  });

  describe('getPropertyMemberByIdAndPropertyId', () => {
    it('lanza PropertyNotFound si no es propietario', async () => {
      propertyRepository.findPropertyById.mockResolvedValue(null);
      await expect(
        service.getPropertyMemberByIdAndPropertyId('u1', 'm1', 'p1'),
      ).rejects.toBeInstanceOf(PropertyNotFoundException);
    });

    it('lanza PropertyMemberNotFound si el miembro no existe', async () => {
      propertyRepository.findPropertyById.mockResolvedValue({ id: 'p1' });
      propertyMemberRepository.findPropertyMemberByIdAndPropertyId.mockResolvedValue(
        null,
      );

      await expect(
        service.getPropertyMemberByIdAndPropertyId('u1', 'm1', 'p1'),
      ).rejects.toBeInstanceOf(PropertyMemberNotFound);
    });

    it('combina el miembro con el usuario del microservicio y limpia políticas', async () => {
      propertyRepository.findPropertyById.mockResolvedValue({ id: 'p1' });
      propertyMemberRepository.findPropertyMemberByIdAndPropertyId.mockResolvedValue(
        {
          id: 'm1',
          userId: 'u2',
          status: 'ACTIVE',
          assignedAt: new Date('2026-01-01'),
          roles: ['MIEMBRO'],
          policies: ['A', 'B'],
          overrides: ['A'],
        },
      );
      (getUserData as jest.Mock).mockResolvedValue({
        userId: 'u2',
        username: 'ana',
        email: 'a@b.co',
        cellphone: '3',
        fullname: 'Ana',
        identificationType: 'CC',
        identificationNumber: 1,
      });

      const res = await service.getPropertyMemberByIdAndPropertyId(
        'u1',
        'm1',
        'p1',
      );

      expect(res).toMatchObject({
        id: 'm1',
        policies: ['B'],
        roles: ['MIEMBRO'],
        fullname: 'Ana',
      });
    });
  });

  describe('invitePropertyMembers', () => {
    const req = { email: 'x@y.co', propertyId: 'p1' };

    beforeEach(() => {
      propertyRepository.findPropertyById.mockResolvedValue({
        id: 'p1',
        propertyName: 'Casa',
      });
      (getUserData as jest.Mock).mockResolvedValue({
        isEnabled: true,
        userId: 'invited',
      });
      globalRepository.saveInvitationLinked.mockResolvedValue({
        id: 'inv1',
        invitedEmailTo: 'x@y.co',
      });
    });

    it('solo el propietario del inmueble puede invitar', async () => {
      propertyRepository.findPropertyById.mockResolvedValue(null);
      await expect(
        service.invitePropertyMembers('owner', req),
      ).rejects.toBeInstanceOf(PropertyNotFoundException);
      expect(sendInvitedEmailTo).not.toHaveBeenCalled();
    });

    it('lanza UserNotFound si el usuario no está habilitado y no envía el correo', async () => {
      (getUserData as jest.Mock).mockResolvedValue({
        isEnabled: false,
        userId: 'invited',
      });

      await expect(
        service.invitePropertyMembers('owner', req),
      ).rejects.toBeInstanceOf(UserNotFound);
      expect(sendInvitedEmailTo).not.toHaveBeenCalled();
    });

    it('envía el correo con el token y guarda la invitación DRAFT con 15 min de vigencia', async () => {
      const before = Date.now();

      const res = await service.invitePropertyMembers('owner', req);

      expect(sendInvitedEmailTo).toHaveBeenCalledWith(
        'x@y.co',
        'TOKEN-20-CHARS',
        'Casa',
      );
      const saved = globalRepository.saveInvitationLinked.mock.calls[0][0];
      expect(saved).toMatchObject({
        propertyId: 'p1',
        invitedBy: 'owner',
        invitedUserId: 'invited',
        invitedEmailTo: 'x@y.co',
        status: 'DRAFT',
        token: 'TOKEN-20-CHARS',
      });
      const ttl = saved.expirationTime.getTime() - before;
      expect(ttl).toBeGreaterThanOrEqual(15 * 60 * 1000 - 50);
      expect(ttl).toBeLessThan(15 * 60 * 1000 + 5_000);
      expect(res).toEqual({
        id: 'inv1',
        invitedEmailTo: 'x@y.co',
        message: expect.any(String),
      });
    });

    it('si el envío del correo falla no persiste la invitación', async () => {
      (sendInvitedEmailTo as jest.Mock).mockRejectedValue(new Error('resend'));

      await expect(service.invitePropertyMembers('owner', req)).rejects.toThrow(
        'resend',
      );
      expect(globalRepository.saveInvitationLinked).not.toHaveBeenCalled();
    });
  });

  describe('acceptPropertyMemberInvitation', () => {
    const invitation = (over: Record<string, unknown> = {}) => ({
      invitedUserId: 'invited',
      invitedBy: 'owner',
      propertyId: 'p1',
      status: 'DRAFT',
      expirationTime: new Date(Date.now() + 60_000),
      ...over,
    });

    it('lanza InvitationLinkedNotFound si el token no existe', async () => {
      globalRepository.findPropertyInvitationByToken.mockResolvedValue(null);
      await expect(
        service.acceptPropertyMemberInvitation('t'),
      ).rejects.toBeInstanceOf(InvitationLinkedNotFoundException);
    });

    it('rechaza invitaciones expiradas', async () => {
      globalRepository.findPropertyInvitationByToken.mockResolvedValue(
        invitation({ expirationTime: new Date(Date.now() - 1) }),
      );
      await expect(
        service.acceptPropertyMemberInvitation('t'),
      ).rejects.toBeInstanceOf(InvitationLinkedExpiredException);
    });

    it('rechaza invitaciones que no están en DRAFT', async () => {
      globalRepository.findPropertyInvitationByToken.mockResolvedValue(
        invitation({ status: 'CONSUMED' }),
      );
      await expect(
        service.acceptPropertyMemberInvitation('t'),
      ).rejects.toBeInstanceOf(InvitationLinkedStatusNotAllowedException);
      expect(
        propertyMemberRepository.savePropertyMember,
      ).not.toHaveBeenCalled();
    });

    it('crea el miembro IN_PROCESS con rol MIEMBRO en una transacción', async () => {
      globalRepository.findPropertyInvitationByToken.mockResolvedValue(
        invitation(),
      );
      propertyMemberRepository.savePropertyMember.mockResolvedValue({
        id: 'm-new',
      });

      await service.acceptPropertyMemberInvitation('t');

      expect(propertyMemberRepository.savePropertyMember).toHaveBeenCalledWith(
        {
          userId: 'invited',
          assignedBy: 'owner',
          propertyId: 'p1',
          status: 'IN_PROCESS',
        },
        tx,
      );
      expect(
        propertyMemberRepository.savePropertyMemberRole,
      ).toHaveBeenCalledWith(
        {
          propertyMemberId: 'm-new',
          propertyActorRoleId: TYPE_PROPERTY_ACTOR_ROLE_UUIDS.MIEMBRO,
        },
        tx,
      );
    });

    // regresión B12: la invitación queda CONSUMED en la misma transacción
    it('marca la invitación como CONSUMED tras aceptarla', async () => {
      globalRepository.findPropertyInvitationByToken.mockResolvedValue(
        invitation({ id: 'inv1' }),
      );
      propertyMemberRepository.savePropertyMember.mockResolvedValue({
        id: 'm-new',
      });

      await service.acceptPropertyMemberInvitation('t');

      expect(globalRepository.markInvitationAsConsumed).toHaveBeenCalledWith(
        'inv1',
        tx,
      );
    });
  });

  describe('assignmentRolesToMember', () => {
    const memberWithRoles = (status: string, roles: string[] = []) => ({
      id: 'm1',
      userId: 'u2',
      propertyId: 'p1',
      status,
      assignedBy: 'owner',
      assignedAt: new Date(),
      updateAt: new Date(),
      propertyMemberRole: roles.map((name) => ({
        propertyActorRole: { id: name, name },
      })),
    });

    beforeEach(() => {
      propertyRepository.findPropertyById.mockResolvedValue({ id: 'p1' });
    });

    it('solo el propietario puede asignar roles', async () => {
      propertyRepository.findPropertyById.mockResolvedValue(null);
      await expect(
        service.assignmentRolesToMember('u1', 'm1', 'p1', ['INVITADO']),
      ).rejects.toBeInstanceOf(PropertyNotFoundException);
    });

    it('lanza PropertyMemberNotFound si el miembro no existe en la propiedad', async () => {
      propertyMemberRepository.findPropertyMemberWithRolesByPropertyMemberIdAndPropertyId.mockResolvedValue(
        null,
      );
      await expect(
        service.assignmentRolesToMember('u1', 'm1', 'p1', ['INVITADO']),
      ).rejects.toBeInstanceOf(PropertyMemberNotFound);
    });

    it('no permite asignar roles a miembros DESACTIVE', async () => {
      propertyMemberRepository.findPropertyMemberWithRolesByPropertyMemberIdAndPropertyId.mockResolvedValue(
        memberWithRoles('DESACTIVE'),
      );
      await expect(
        service.assignmentRolesToMember('u1', 'm1', 'p1', ['INVITADO']),
      ).rejects.toBeInstanceOf(NotAllowedStatusByPropertyMemberException);
    });

    it('rechaza si el miembro ya posee alguno de los roles', async () => {
      propertyMemberRepository.findPropertyMemberWithRolesByPropertyMemberIdAndPropertyId.mockResolvedValue(
        memberWithRoles('ACTIVE', ['INVITADO']),
      );
      await expect(
        service.assignmentRolesToMember('u1', 'm1', 'p1', [
          'INVITADO',
          'FAMILIAR',
        ]),
      ).rejects.toBeInstanceOf(AssingnmentStatusNotAllowedException);
      expect(
        propertyMemberRepository.savePropertyMemberWithRoles,
      ).not.toHaveBeenCalled();
    });

    it('asigna los UUIDs de rol y activa al miembro IN_PROCESS', async () => {
      propertyMemberRepository.findPropertyMemberWithRolesByPropertyMemberIdAndPropertyId.mockResolvedValue(
        memberWithRoles('IN_PROCESS', ['MIEMBRO']),
      );

      await service.assignmentRolesToMember('u1', 'm1', 'p1', [
        'INVITADO',
        'FAMILIAR',
      ]);

      expect(
        propertyMemberRepository.savePropertyMemberWithRoles,
      ).toHaveBeenCalledWith(
        'm1',
        [
          TYPE_PROPERTY_ACTOR_ROLE_UUIDS.INVITADO,
          TYPE_PROPERTY_ACTOR_ROLE_UUIDS.FAMILIAR,
        ],
        tx,
      );
      expect(
        propertyMemberRepository.updatePropertyMemberStatus,
      ).toHaveBeenCalledWith('m1', 'ACTIVE');
    });

    it('no cambia el estado de miembros que ya están ACTIVE', async () => {
      propertyMemberRepository.findPropertyMemberWithRolesByPropertyMemberIdAndPropertyId.mockResolvedValue(
        memberWithRoles('ACTIVE'),
      );

      await service.assignmentRolesToMember('u1', 'm1', 'p1', ['INVITADO']);

      expect(
        propertyMemberRepository.updatePropertyMemberStatus,
      ).not.toHaveBeenCalled();
    });
  });

  describe('consultas del propio usuario', () => {
    it('getAllPropertiesByPropertyMemberId delega con el filtro de estado', async () => {
      propertyRepository.findAllPartialPropertyInfoByPropertyMemberId.mockResolvedValue(
        {
          data: [],
        },
      );
      await service.getAllPropertiesByPropertyMemberId(
        'u1',
        { status: 'ACTIVE' },
        {
          page: 1,
          limit: 10,
        },
      );
      expect(
        propertyRepository.findAllPartialPropertyInfoByPropertyMemberId,
      ).toHaveBeenCalledWith('u1', 'ACTIVE', { page: 1, limit: 10 });
    });

    it('getPropertyByPropertyMemberId lanza PropertyNotFound si no es miembro', async () => {
      propertyRepository.findPartialPropertyInfoByPropertyMemberId.mockResolvedValue(
        null,
      );
      await expect(
        service.getPropertyByPropertyMemberId('u1', 'p1'),
      ).rejects.toBeInstanceOf(PropertyNotFoundException);
    });

    it('getPropertyByPropertyMemberId devuelve nombre y descripción', async () => {
      propertyRepository.findPartialPropertyInfoByPropertyMemberId.mockResolvedValue(
        {
          propertyName: 'n',
          propertyDescription: 'd',
        },
      );
      await expect(
        service.getPropertyByPropertyMemberId('u1', 'p1'),
      ).resolves.toEqual({
        propertyName: 'n',
        propertyDescription: 'd',
      });
    });
  });

  describe('propertyMemberMe', () => {
    it('lanza PropertyMemberNotFound si el usuario no es miembro', async () => {
      propertyMemberRepository.findPropertyMemberByUserIdAndPropertyId.mockResolvedValue(
        null,
      );
      await expect(service.propertyMemberMe('p1', 'u1')).rejects.toBeInstanceOf(
        PropertyMemberNotFound,
      );
    });

    it('devuelve info, roles y políticas efectivas (sin overrides ni duplicados)', async () => {
      const info = {
        id: 'm1',
        userId: 'u1',
        propertyId: 'p1',
        status: 'ACTIVE',
      };
      propertyMemberRepository.findPropertyMemberByUserIdAndPropertyId.mockResolvedValue(
        info,
      );
      systemPropertyRepository.findAllPoliciesByPropertyMemberId.mockResolvedValue(
        ['A', 'B', 'A'],
      );
      systemPropertyRepository.findActorRolesByPropertyMemberId.mockResolvedValue(
        ['PROPIETARIO'],
      );
      systemPropertyRepository.findOverridePolicyByPropertyMemberId.mockResolvedValue(
        ['B'],
      );

      await expect(service.propertyMemberMe('p1', 'u1')).resolves.toEqual({
        info,
        roles: ['PROPIETARIO'],
        policies: ['A'],
      });
    });

    it('devuelve políticas vacías si el repositorio no encuentra ninguna', async () => {
      propertyMemberRepository.findPropertyMemberByUserIdAndPropertyId.mockResolvedValue(
        {
          id: 'm1',
        },
      );
      systemPropertyRepository.findAllPoliciesByPropertyMemberId.mockResolvedValue(
        undefined,
      );
      systemPropertyRepository.findActorRolesByPropertyMemberId.mockResolvedValue(
        [],
      );
      systemPropertyRepository.findOverridePolicyByPropertyMemberId.mockResolvedValue(
        [],
      );

      const res = await service.propertyMemberMe('p1', 'u1');
      expect(res.policies).toEqual([]);
    });
  });

  describe('changeStatusPropertyMember', () => {
    const body = { propertyId: 'p1', status: 'DESACTIVE' as const };

    it('solo el propietario puede cambiar estados', async () => {
      propertyRepository.findPropertyById.mockResolvedValue(null);
      await expect(
        service.changeStatusPropertyMember('u1', 'm1', body),
      ).rejects.toBeInstanceOf(PropertyNotFoundException);
    });

    it('lanza si el miembro ya tiene ese estado', async () => {
      propertyRepository.findPropertyById.mockResolvedValue({ id: 'p1' });
      systemRole.verifyPropertyMemberByIdAndPropertyIdWithoutStatus.mockResolvedValue(
        {
          id: 'm1',
          status: 'DESACTIVE',
        },
      );

      await expect(
        service.changeStatusPropertyMember('u1', 'm1', body),
      ).rejects.toBeInstanceOf(ChangeStatusPropertyMemberException);
      expect(
        propertyMemberRepository.updatePropertyMemberStatus,
      ).not.toHaveBeenCalled();
    });

    it('actualiza el estado y devuelve ids', async () => {
      propertyRepository.findPropertyById.mockResolvedValue({ id: 'p1' });
      systemRole.verifyPropertyMemberByIdAndPropertyIdWithoutStatus.mockResolvedValue(
        {
          id: 'm1',
          status: 'ACTIVE',
        },
      );

      const res = await service.changeStatusPropertyMember('u1', 'm1', body);

      expect(
        propertyMemberRepository.updatePropertyMemberStatus,
      ).toHaveBeenCalledWith('m1', 'DESACTIVE');
      expect(res).toEqual({
        propertyId: 'p1',
        propertyMemberId: 'm1',
        message: expect.any(String),
      });
    });

    // regresión B19: el propietario no puede desactivarse a sí mismo
    it('no permite desactivar al propio propietario', async () => {
      propertyRepository.findPropertyById.mockResolvedValue({ id: 'p1' });
      systemRole.verifyPropertyMemberByIdAndPropertyIdWithoutStatus.mockResolvedValue(
        {
          id: 'm1',
          userId: 'u1',
          status: 'ACTIVE',
        },
      );

      await expect(
        service.changeStatusPropertyMember('u1', 'm1', body),
      ).rejects.toBeDefined();
    });
  });
});
