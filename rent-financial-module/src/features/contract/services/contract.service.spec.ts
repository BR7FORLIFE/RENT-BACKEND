import { ContractService } from './contract.service.js';
import {
  contractDraftAcceptedNotFound,
  contractDraftAvailabilityNotFoundException,
  contractDraftNotFound,
  contractNotFound,
  deniedTransitionedStatusContract,
  propertyWithContractAvalibityException,
} from '../exceptions/exceptions.js';
import { PropertyNotFoundException } from '../../property-registration/exceptions/exceptions.js';
import { PoliciesAuthorizationNotAllowed } from '../../system-property-role/exceptions/exceptions.js';
import { getUserData } from '../../property-registration/api.js';
import { TYPE_TENANT_ACTOR_ROLES_UUIDS } from '../../../types/global-types.js';

jest.mock('../../property-registration/api.js', () => ({
  getUserData: jest.fn(),
}));

const PAGINATION = { page: 1, limit: 10 };

describe('ContractService', () => {
  const tx = { __tx: true };
  const prisma = { $transaction: jest.fn() };
  const contractRepository = {
    findLastVersionInContractDraft: jest.fn(),
    saveContractDraft: jest.fn(),
    findAllContractDraftByPropertyId: jest.fn(),
    findContractDraftByIdAndPropertyId: jest.fn(),
    findContractDraftByMemberId: jest.fn(),
    updateAgreeContractDraft: jest.fn(),
    findContractByStatusContractAndPropertyId: jest.fn(),
    findContractDraftAvailability: jest.fn(),
    saveContract: jest.fn(),
    findContractByIdAndTenantMemberId: jest.fn(),
    findContractByIdAndPropertyId: jest.fn(),
    updateStatusContractByTenantId: jest.fn(),
    updateStatusContractById: jest.fn(),
    saveContractResourcesByContractId: jest.fn(),
    findAllContractByPropertyId: jest.fn(),
    findAllContractAccepted: jest.fn(),
    findContractAcceptedById: jest.fn(),
  };
  const propertyRepository = { findPropertyByIdAndPropertyMemberId: jest.fn() };
  const propertyMemberRepository = {
    findPropertyMemberWithRolesByPropertyMemberIdAndPropertyId: jest.fn(),
    savePropertyMemberRole: jest.fn(),
  };
  const systemRole = {
    verifyPropertyMemberByUserIdInPropertyId: jest.fn(),
    verifyPropertyMemberByIdAndPropertyId: jest.fn(),
    CheckPolicies: jest.fn(),
  };
  const systemRoleRepository = { updatePropertyActorRole: jest.fn() };
  const notificationService = { sendNotification: jest.fn() };
  const notificationGateway = { sendNotification: jest.fn() };

  let service: ContractService;

  const requester = {
    id: 'm-req',
    userId: 'u-req',
    propertyId: 'p1',
    status: 'ACTIVE',
  };
  const landlord = {
    id: 'm-land',
    userId: 'u-land',
    propertyId: 'p1',
    status: 'ACTIVE',
  };
  const tenant = {
    id: 'm-ten',
    userId: 'u-ten',
    propertyId: 'p1',
    status: 'ACTIVE',
  };

  beforeEach(() => {
    jest.resetAllMocks();
    prisma.$transaction.mockImplementation((cb: (t: unknown) => unknown) =>
      cb(tx),
    );
    service = new ContractService(
      prisma as never,
      contractRepository as never,
      propertyRepository as never,
      propertyMemberRepository as never,
      systemRole as never,
      systemRoleRepository as never,
      notificationService as never,
      notificationGateway as never,
    );
    systemRole.verifyPropertyMemberByUserIdInPropertyId.mockResolvedValue(
      requester,
    );
    systemRole.CheckPolicies.mockResolvedValue(undefined);
  });

  describe('generateContractDraft', () => {
    const dto = {
      content: 'texto',
      propertyId: 'p1',
      landlordMemberId: landlord.id,
      tenantMemberId: tenant.id,
      monthlyRent: 1000,
      depositAmount: 500,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2027-01-01'),
    };

    beforeEach(() => {
      propertyRepository.findPropertyByIdAndPropertyMemberId.mockResolvedValue({
        id: 'p1',
        propertyName: 'Casa Azul',
      });
      systemRole.verifyPropertyMemberByIdAndPropertyId.mockImplementation(
        (id: string) => Promise.resolve(id === landlord.id ? landlord : tenant),
      );
      contractRepository.findLastVersionInContractDraft.mockResolvedValue(3);
      contractRepository.saveContractDraft.mockResolvedValue({
        id: 'd1',
        version: 3,
      });
      propertyMemberRepository.findPropertyMemberWithRolesByPropertyMemberIdAndPropertyId.mockResolvedValue(
        { propertyMemberRole: [] },
      );
      notificationService.sendNotification.mockResolvedValue({ n: 1 });
    });

    it('exige la política REGISTRAR_CONTRATOS', async () => {
      await service.generateContractDraft('u-req', dto);
      expect(systemRole.CheckPolicies).toHaveBeenCalledWith(requester.id, [
        'REGISTRAR_CONTRATOS',
      ]);
    });

    it('no crea nada si la política falla', async () => {
      systemRole.CheckPolicies.mockRejectedValue(
        new PoliciesAuthorizationNotAllowed(),
      );

      await expect(
        service.generateContractDraft('u-req', dto),
      ).rejects.toBeInstanceOf(PoliciesAuthorizationNotAllowed);
      expect(contractRepository.saveContractDraft).not.toHaveBeenCalled();
    });

    it('lanza PropertyNotFound si la propiedad no corresponde al miembro', async () => {
      propertyRepository.findPropertyByIdAndPropertyMemberId.mockResolvedValue(
        null,
      );
      await expect(
        service.generateContractDraft('u-req', dto),
      ).rejects.toBeInstanceOf(PropertyNotFoundException);
    });

    it('guarda el borrador con la siguiente versión, sin aceptaciones y dentro de la transacción', async () => {
      const res = await service.generateContractDraft('u-req', dto);

      expect(contractRepository.saveContractDraft).toHaveBeenCalledWith(
        expect.objectContaining({
          content: 'texto',
          version: 3,
          landlordAgreed: false,
          tenantAgreed: false,
          createdByPropertyMemberId: requester.id,
          landlordMemberId: landlord.id,
          tenantMemberId: tenant.id,
          monthlyRent: 1000,
          depositAmount: 500,
        }),
        tx,
      );
      expect(res).toMatchObject({
        id: 'd1',
        version: 3,
        message: expect.any(String),
      });
    });

    it('asigna ARRENDADO_PRELIMINAR al arrendatario si aún no lo tiene', async () => {
      await service.generateContractDraft('u-req', dto);

      expect(
        propertyMemberRepository.savePropertyMemberRole,
      ).toHaveBeenCalledWith(
        {
          propertyMemberId: tenant.id,
          propertyActorRoleId:
            TYPE_TENANT_ACTOR_ROLES_UUIDS.ARRENDADO_PRELIMINAR,
        },
        tx,
      );
    });

    it('NO duplica el rol si ya tiene ARRENDADO_PRELIMINAR', async () => {
      propertyMemberRepository.findPropertyMemberWithRolesByPropertyMemberIdAndPropertyId.mockResolvedValue(
        {
          propertyMemberRole: [
            { propertyActorRole: { name: 'ARRENDADO_PRELIMINAR' } },
          ],
        },
      );

      await service.generateContractDraft('u-req', dto);

      expect(
        propertyMemberRepository.savePropertyMemberRole,
      ).not.toHaveBeenCalled();
    });

    it('notifica por BD y WebSocket a arrendador y arrendatario', async () => {
      await service.generateContractDraft('u-req', dto);

      expect(notificationService.sendNotification).toHaveBeenCalledTimes(2);
      expect(notificationService.sendNotification).toHaveBeenCalledWith(
        'u-req',
        landlord.userId,
        expect.stringContaining('Casa Azul'),
        'Borrador de contrato',
        'CONTRACT_SERVICE',
        'INFO',
      );
      expect(notificationGateway.sendNotification).toHaveBeenCalledWith(
        landlord.userId,
        {
          n: 1,
        },
      );
      expect(notificationGateway.sendNotification).toHaveBeenCalledWith(
        tenant.userId,
        {
          n: 1,
        },
      );
    });
  });

  describe('lecturas de borradores', () => {
    it('getAllContractDraft exige VER_CONTRATOS_PRELIMINARES y pagina', async () => {
      contractRepository.findAllContractDraftByPropertyId.mockResolvedValue({
        data: [],
      });

      await service.getAllContractDraft('u-req', 'p1', PAGINATION);

      expect(systemRole.CheckPolicies).toHaveBeenCalledWith(requester.id, [
        'VER_CONTRATOS_PRELIMINARES',
      ]);
      expect(
        contractRepository.findAllContractDraftByPropertyId,
      ).toHaveBeenCalledWith('p1', PAGINATION);
    });

    it('getAllContractDraft no consulta datos sin política', async () => {
      systemRole.CheckPolicies.mockRejectedValue(
        new PoliciesAuthorizationNotAllowed(),
      );
      await expect(
        service.getAllContractDraft('u-req', 'p1', PAGINATION),
      ).rejects.toBeInstanceOf(PoliciesAuthorizationNotAllowed);
      expect(
        contractRepository.findAllContractDraftByPropertyId,
      ).not.toHaveBeenCalled();
    });

    describe('getContractDraftById', () => {
      it('lanza contractDraftNotFound si no existe en la propiedad', async () => {
        contractRepository.findContractDraftByIdAndPropertyId.mockResolvedValue(
          null,
        );
        await expect(
          service.getContractDraftById('u-req', 'd1', 'p1'),
        ).rejects.toBeInstanceOf(contractDraftNotFound);
      });

      it('enriquece con datos de usuario del microservicio de auth', async () => {
        contractRepository.findContractDraftByIdAndPropertyId.mockResolvedValue(
          {
            id: 'd1',
            landlordMemberId: landlord.id,
            tenantMemberId: tenant.id,
          },
        );
        systemRole.verifyPropertyMemberByIdAndPropertyId.mockImplementation(
          (id: string) =>
            Promise.resolve(id === landlord.id ? landlord : tenant),
        );
        (getUserData as jest.Mock).mockImplementation(
          (_e: unknown, userId: string) =>
            Promise.resolve({ userId, fullname: `name-${userId}` }),
        );

        const res = await service.getContractDraftById('u-req', 'd1', 'p1');

        expect(res.landlordMember).toEqual({
          propertyMemberId: landlord.id,
          userData: { userId: landlord.userId, fullname: 'name-u-land' },
        });
        expect(res.tenantMember.userData.fullname).toBe('name-u-ten');
      });
    });
  });

  describe('agreeContractDraft', () => {
    it('marca aceptación del arrendatario si es el tenant del borrador', async () => {
      contractRepository.findContractDraftByMemberId.mockImplementation(
        (_d: string, _p: string, _m: string, sel: string) =>
          Promise.resolve(sel === 'TENANT' ? { id: 'd1' } : null),
      );

      const res = await service.agreeContractDraft('u-req', 'p1', 'd1');

      expect(contractRepository.updateAgreeContractDraft).toHaveBeenCalledWith(
        'd1',
        'TENANT',
      );
      expect(res.contractDraftId).toBe('d1');
    });

    it('marca aceptación del arrendador si no es tenant pero sí landlord', async () => {
      contractRepository.findContractDraftByMemberId.mockImplementation(
        (_d: string, _p: string, _m: string, sel: string) =>
          Promise.resolve(sel === 'LANDLORD' ? { id: 'd1' } : null),
      );

      await service.agreeContractDraft('u-req', 'p1', 'd1');

      expect(contractRepository.updateAgreeContractDraft).toHaveBeenCalledWith(
        'd1',
        'LANDLORD',
      );
    });

    it('lanza contractDraftNotFound si no participa en el borrador', async () => {
      contractRepository.findContractDraftByMemberId.mockResolvedValue(null);

      await expect(
        service.agreeContractDraft('u-req', 'p1', 'd1'),
      ).rejects.toBeInstanceOf(contractDraftNotFound);
      expect(
        contractRepository.updateAgreeContractDraft,
      ).not.toHaveBeenCalled();
    });
  });

  describe('createContract', () => {
    const dto = {
      propertyId: 'p1',
      landlordMemberId: landlord.id,
      tenantMemberId: tenant.id,
    };
    const draft = {
      id: 'd1',
      landlordMemberId: landlord.id,
      tenantMemberId: tenant.id,
      depositAmount: '500',
      monthlyRent: '1000',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2027-01-01'),
    };

    beforeEach(() => {
      propertyRepository.findPropertyByIdAndPropertyMemberId.mockResolvedValue({
        id: 'p1',
      });
      contractRepository.findContractByStatusContractAndPropertyId.mockResolvedValue(
        null,
      );
      systemRole.verifyPropertyMemberByIdAndPropertyId.mockImplementation(
        (id: string) => Promise.resolve(id === landlord.id ? landlord : tenant),
      );
      contractRepository.findContractDraftAvailability.mockResolvedValue(draft);
      contractRepository.saveContract.mockResolvedValue({ id: 'c1' });
      notificationService.sendNotification.mockResolvedValue({ n: 1 });
    });

    it('exige REGISTRAR_CONTRATOS', async () => {
      await service.createContract('u-req', dto);
      expect(systemRole.CheckPolicies).toHaveBeenCalledWith(requester.id, [
        'REGISTRAR_CONTRATOS',
      ]);
    });

    it('bloquea si la propiedad ya tiene un contrato ACTIVO', async () => {
      contractRepository.findContractByStatusContractAndPropertyId.mockResolvedValue(
        { id: 'x' },
      );

      await expect(service.createContract('u-req', dto)).rejects.toBeInstanceOf(
        propertyWithContractAvalibityException,
      );
      expect(
        contractRepository.findContractByStatusContractAndPropertyId,
      ).toHaveBeenCalledWith('ACTIVO', 'p1');
      expect(contractRepository.saveContract).not.toHaveBeenCalled();
    });

    it('lanza PropertyNotFound si la propiedad no existe para el miembro', async () => {
      propertyRepository.findPropertyByIdAndPropertyMemberId.mockResolvedValue(
        null,
      );
      await expect(service.createContract('u-req', dto)).rejects.toBeInstanceOf(
        PropertyNotFoundException,
      );
    });

    it('requiere un borrador aceptado por ambas partes', async () => {
      contractRepository.findContractDraftAvailability.mockResolvedValue(null);

      await expect(service.createContract('u-req', dto)).rejects.toBeInstanceOf(
        contractDraftAvailabilityNotFoundException,
      );
      expect(contractRepository.saveContract).not.toHaveBeenCalled();
    });

    it('crea el contrato en PENDIENTE_ACEPTACION con los términos del borrador', async () => {
      const res = await service.createContract('u-req', dto);

      expect(contractRepository.saveContract).toHaveBeenCalledWith(
        {
          createByUserId: 'u-req',
          depositAmount: 500,
          monthlyRent: 1000,
          startDate: draft.startDate,
          endDate: draft.endDate,
          landlordMemberId: landlord.id,
          tenantMemberId: tenant.id,
          propertyId: 'p1',
          status: 'PENDIENTE_ACEPTACION',
        },
        tx,
      );
      expect(res).toEqual({ id: 'c1', message: expect.any(String) });
    });

    it('notifica a ambas partes', async () => {
      await service.createContract('u-req', dto);
      expect(notificationGateway.sendNotification).toHaveBeenCalledTimes(2);
    });

    // regresión B10: se usa el landlordMemberId del request
    it('usa el landlordMemberId indicado en el request', async () => {
      await service.createContract('u-req', dto);
      expect(contractRepository.saveContract).toHaveBeenCalledWith(
        expect.objectContaining({ landlordMemberId: landlord.id }),
        tx,
      );
    });

    // regresión B10: el borrador debe corresponder al arrendatario del request
    it('el borrador debe corresponder al tenantMemberId solicitado', async () => {
      contractRepository.findContractDraftAvailability.mockResolvedValue({
        ...draft,
        tenantMemberId: 'otro-tenant',
      });

      await expect(service.createContract('u-req', dto)).rejects.toBeDefined();
    });
  });

  describe('AcceptedOrRejectedContractByTenant', () => {
    const pending = { id: 'c1', status: 'PENDIENTE_ACEPTACION' };

    beforeEach(() => {
      systemRole.verifyPropertyMemberByUserIdInPropertyId.mockResolvedValue(
        tenant,
      );
      contractRepository.findContractByIdAndTenantMemberId.mockResolvedValue(
        pending,
      );
    });

    it('lanza contractNotFound si el contrato no existe para el arrendatario', async () => {
      contractRepository.findContractByIdAndTenantMemberId.mockResolvedValue(
        null,
      );

      await expect(
        service.AcceptedOrRejectedContractByTenant(
          'c1',
          'p1',
          'u-ten',
          'ACCEPTED',
        ),
      ).rejects.toBeInstanceOf(contractNotFound);
    });

    it.each([
      'ACTIVO',
      'RECHAZADO',
      'SUSPENDIDO',
      'FINALIZADO',
      'PENDIENTE_DOCUMENTACION',
    ])('rechaza la transición desde %s', async (status) => {
      contractRepository.findContractByIdAndTenantMemberId.mockResolvedValue({
        id: 'c1',
        status,
      });

      await expect(
        service.AcceptedOrRejectedContractByTenant(
          'c1',
          'p1',
          'u-ten',
          'ACCEPTED',
        ),
      ).rejects.toBeInstanceOf(deniedTransitionedStatusContract);
    });

    // regresión B1: el estado de origen es 'PENDIENTE_ACEPTACION'
    describe('contrato en PENDIENTE_ACEPTACION', () => {
      it('ACCEPTED -> PENDIENTE_DOCUMENTACION y rol ARRENDADO', async () => {
        const res = await service.AcceptedOrRejectedContractByTenant(
          'c1',
          'p1',
          'u-ten',
          'ACCEPTED',
        );

        expect(
          contractRepository.updateStatusContractByTenantId,
        ).toHaveBeenCalledWith('c1', tenant.id, 'PENDIENTE_DOCUMENTACION', tx);
        expect(
          systemRoleRepository.updatePropertyActorRole,
        ).toHaveBeenCalledWith(
          tenant.id,
          TYPE_TENANT_ACTOR_ROLES_UUIDS.ARRENDADO_PRELIMINAR,
          TYPE_TENANT_ACTOR_ROLES_UUIDS.ARRENDADO,
          tx,
        );
        expect(res.contractId).toBe('c1');
      });

      it('REJECTED -> RECHAZADO', async () => {
        await service.AcceptedOrRejectedContractByTenant(
          'c1',
          'p1',
          'u-ten',
          'REJECTED',
        );

        expect(
          contractRepository.updateStatusContractByTenantId,
        ).toHaveBeenCalledWith('c1', tenant.id, 'RECHAZADO', tx);
      });
    });

    // regresión B2: se busca con el id del PropertyMember, no con el userId
    it('busca el contrato por el id del miembro (no por userId)', async () => {
      await service
        .AcceptedOrRejectedContractByTenant('c1', 'p1', 'u-ten', 'ACCEPTED')
        .catch(() => undefined);

      expect(
        contractRepository.findContractByIdAndTenantMemberId,
      ).toHaveBeenCalledWith('c1', tenant.id);
    });
  });

  describe('loadContractDocumentation', () => {
    const resources = [{ url: 'http://doc' }];

    it('exige SUBIR_DOCUMENTOS_CONTRATO', async () => {
      contractRepository.findContractByIdAndPropertyId.mockResolvedValue({
        id: 'c1',
        status: 'PENDIENTE_DOCUMENTACION',
      });
      await service.loadContractDocumentation('u-req', 'p1', 'c1', resources);
      expect(systemRole.CheckPolicies).toHaveBeenCalledWith(requester.id, [
        'SUBIR_DOCUMENTOS_CONTRATO',
      ]);
    });

    it('lanza contractNotFound si el contrato no pertenece a la propiedad', async () => {
      contractRepository.findContractByIdAndPropertyId.mockResolvedValue(null);
      await expect(
        service.loadContractDocumentation('u-req', 'p1', 'c1', resources),
      ).rejects.toBeInstanceOf(contractNotFound);
    });

    it.each(['PENDIENTE_ACEPTACION', 'ACTIVO', 'RECHAZADO'])(
      'solo permite cargar documentos en PENDIENTE_DOCUMENTACION (no %s)',
      async (status) => {
        contractRepository.findContractByIdAndPropertyId.mockResolvedValue({
          id: 'c1',
          status,
        });

        await expect(
          service.loadContractDocumentation('u-req', 'p1', 'c1', resources),
        ).rejects.toBeInstanceOf(deniedTransitionedStatusContract);
        expect(
          contractRepository.saveContractResourcesByContractId,
        ).not.toHaveBeenCalled();
      },
    );

    it('guarda documentos y activa el contrato atómicamente', async () => {
      contractRepository.findContractByIdAndPropertyId.mockResolvedValue({
        id: 'c1',
        status: 'PENDIENTE_DOCUMENTACION',
      });

      const res = await service.loadContractDocumentation(
        'u-req',
        'p1',
        'c1',
        resources,
      );

      expect(
        contractRepository.saveContractResourcesByContractId,
      ).toHaveBeenCalledWith('c1', resources, tx);
      expect(contractRepository.updateStatusContractById).toHaveBeenCalledWith(
        'c1',
        'ACTIVO',
        tx,
      );
      expect(res.contractId).toBe('c1');
    });
  });

  describe('handleContractStatus', () => {
    beforeEach(() => {
      contractRepository.findContractByIdAndPropertyId.mockResolvedValue({
        id: 'c1',
        status: 'ACTIVO',
      });
    });

    it('lanza contractNotFound si no existe', async () => {
      contractRepository.findContractByIdAndPropertyId.mockResolvedValue(null);
      await expect(
        service.handleContractStatus(
          'u-req',
          'c1',
          { status: 'FINISHED' },
          'p1',
        ),
      ).rejects.toBeInstanceOf(contractNotFound);
    });

    it('FINISHED exige FINALIZAR_CONTRATOS y pasa a FINALIZADO', async () => {
      await service.handleContractStatus(
        'u-req',
        'c1',
        { status: 'FINISHED' },
        'p1',
      );

      expect(systemRole.CheckPolicies).toHaveBeenCalledWith(requester.id, [
        'FINALIZAR_CONTRATOS',
      ]);
      expect(contractRepository.updateStatusContractById).toHaveBeenCalledWith(
        'c1',
        'FINALIZADO',
      );
    });

    it('SUSPENDED exige SUSPENDER_CONTRATOS y pasa a SUSPENDIDO', async () => {
      await service.handleContractStatus(
        'u-req',
        'c1',
        { status: 'SUSPENDED' },
        'p1',
      );

      expect(systemRole.CheckPolicies).toHaveBeenCalledWith(requester.id, [
        'SUSPENDER_CONTRATOS',
      ]);
      expect(contractRepository.updateStatusContractById).toHaveBeenCalledWith(
        'c1',
        'SUSPENDIDO',
      );
    });

    it('no cambia el estado si falta la política', async () => {
      systemRole.CheckPolicies.mockRejectedValue(
        new PoliciesAuthorizationNotAllowed(),
      );

      await expect(
        service.handleContractStatus(
          'u-req',
          'c1',
          { status: 'SUSPENDED' },
          'p1',
        ),
      ).rejects.toBeInstanceOf(PoliciesAuthorizationNotAllowed);
      expect(
        contractRepository.updateStatusContractById,
      ).not.toHaveBeenCalled();
    });

    it.each(['RECHAZADO', 'FINALIZADO', 'PENDIENTE_ACEPTACION'])(
      'no permite suspender desde %s',
      async (status) => {
        contractRepository.findContractByIdAndPropertyId.mockResolvedValue({
          id: 'c1',
          status,
        });

        await expect(
          service.handleContractStatus(
            'u-req',
            'c1',
            { status: 'SUSPENDED' },
            'p1',
          ),
        ).rejects.toBeInstanceOf(deniedTransitionedStatusContract);
        expect(
          contractRepository.updateStatusContractById,
        ).not.toHaveBeenCalled();
      },
    );

    it('permite finalizar un contrato SUSPENDIDO', async () => {
      contractRepository.findContractByIdAndPropertyId.mockResolvedValue({
        id: 'c1',
        status: 'SUSPENDIDO',
      });

      await service.handleContractStatus(
        'u-req',
        'c1',
        { status: 'FINISHED' },
        'p1',
      );

      expect(contractRepository.updateStatusContractById).toHaveBeenCalledWith(
        'c1',
        'FINALIZADO',
      );
    });

    // un contrato RECHAZADO/FINALIZADO no puede suspenderse/finalizarse
    it('no permite finalizar un contrato ya RECHAZADO', async () => {
      contractRepository.findContractByIdAndPropertyId.mockResolvedValue({
        id: 'c1',
        status: 'RECHAZADO',
      });

      await expect(
        service.handleContractStatus(
          'u-req',
          'c1',
          { status: 'FINISHED' },
          'p1',
        ),
      ).rejects.toBeInstanceOf(deniedTransitionedStatusContract);
    });
  });

  describe('lecturas de contratos', () => {
    it('getContractbyId exige VER_CONTRATOS y devuelve datos enriquecidos', async () => {
      contractRepository.findContractByIdAndPropertyId.mockResolvedValue({
        id: 'c1',
        landlordMemberId: landlord.id,
        tenantMemberId: tenant.id,
      });
      systemRole.verifyPropertyMemberByIdAndPropertyId.mockImplementation(
        (id: string) => Promise.resolve(id === landlord.id ? landlord : tenant),
      );
      (getUserData as jest.Mock).mockResolvedValue({ fullname: 'X' });

      const res = await service.getContractbyId('u-req', 'p1', 'c1');

      expect(systemRole.CheckPolicies).toHaveBeenCalledWith(requester.id, [
        'VER_CONTRATOS',
      ]);
      expect(res).toMatchObject({
        id: 'c1',
        landlordMember: {
          propertyMemberId: landlord.id,
          userData: { fullname: 'X' },
        },
        tenantMember: { propertyMemberId: tenant.id },
      });
    });

    it('getContractbyId lanza contractNotFound', async () => {
      contractRepository.findContractByIdAndPropertyId.mockResolvedValue(null);
      await expect(
        service.getContractbyId('u-req', 'p1', 'c1'),
      ).rejects.toBeInstanceOf(contractNotFound);
    });

    it('getAllContracts exige VER_CONTRATOS', async () => {
      contractRepository.findAllContractByPropertyId.mockResolvedValue({
        data: [],
      });

      await service.getAllContracts('u-req', 'p1', PAGINATION);

      expect(systemRole.CheckPolicies).toHaveBeenCalledWith(requester.id, [
        'VER_CONTRATOS',
      ]);
      expect(
        contractRepository.findAllContractByPropertyId,
      ).toHaveBeenCalledWith('p1', PAGINATION);
    });

    it('getAllAcceptedContracts exige VER_CONTRATOS_PRELIMINARES', async () => {
      contractRepository.findAllContractAccepted.mockResolvedValue({
        data: [],
      });

      await service.getAllAcceptedContracts('u-req', 'p1', PAGINATION);

      expect(systemRole.CheckPolicies).toHaveBeenCalledWith(requester.id, [
        'VER_CONTRATOS_PRELIMINARES',
      ]);
    });

    it('getAcceptedContracts devuelve el borrador aceptado o lanza si no existe', async () => {
      contractRepository.findContractAcceptedById.mockResolvedValueOnce({
        id: 'd1',
      });
      await expect(
        service.getAcceptedContracts('u-req', 'p1', 'd1'),
      ).resolves.toEqual({
        id: 'd1',
      });

      contractRepository.findContractAcceptedById.mockResolvedValueOnce(null);
      await expect(
        service.getAcceptedContracts('u-req', 'p1', 'd1'),
      ).rejects.toBeInstanceOf(contractDraftAcceptedNotFound);
    });
  });
});
