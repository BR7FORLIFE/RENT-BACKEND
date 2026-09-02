import { Injectable } from '@nestjs/common';
import { PropertyMemberRepository } from '../repository/property-member.repository.js';
import type {
  createInvitationPropertyMemberType,
  PropertyMemberRoleType,
  PropertyMemberStatus,
  PropertyMemberStatusFilter,
  PropertyMemberType,
} from '../schemas/property-registration.schema.js';
import { PropertyRepository } from '../repository/property.repository.js';
import {
  InvitationLinkedNotFoundException,
  PropertyNotFoundException,
} from '../exceptions/exceptions.js';
import type {
  PaginationResponse,
  PaginationType,
} from '../../../shared/pagination/pagination-schemas.js';
import { PrismaService } from '../../../core/database/prisma.service.js';
import { getAllUsers, getUserData } from '../api.js';
import { unionInfoUser, validateInvitationLinked } from './helpers.service.js';
import type { InvitePropertyMemberType } from '../dtos/request-dto.js';
import { UserNotFound } from '../../../core/global-exception.js';
import {
  generateSecureString,
  sendInvitedEmailTo,
} from './invitation-generation.service.js';
import { GlobalRepository } from '../../global/repository-global.js';
import { TYPE_PROPERTY_ACTOR_ROLE_UUIDS } from '../../../types/global-types.js';
import type { PropertyActorRoleType, PropertyMemberMe } from '../types.js';
import {
  AssingnmentStatusNotAllowedException,
  NotAllowedStatusByPropertyMemberException,
  PropertyMemberNotFound,
} from '../../system-property-role/exceptions/exceptions.js';
import { SystemPropertyRoleRepository } from '../../system-property-role/repository/sytem-property-role.repository.js';
import { cleanPolicies } from '../../system-property-role/services/system-property.service.js';

/**
 * De que se encargara este servicio?
 *
 * - Consultar todos los miembros activos de una propiedad gracias a su ID o filtrar por otro estado
 * - Consultar un miembro en especifico por su ID
 * - Cambiar el estado de actividad (ACTIVE, DESACTIVE, IN_PROCESS) de un miembro
 * - asignar un role al miembro activo y sus permisos para hacer cosas en la propiedad
 * - Historial de cambios para los property Members donde se auditara los cambios de estados, roles, etc.
 */

export interface GetAllUserData {
  userId: string;
  status?: PropertyMemberStatus | undefined;
  assignedAt?: Date | undefined;
  username: string;
  email: string;
  cellphone: string;
  fullname: string;
  roles?: string[];
  policies?: string[];
}

@Injectable()
export class PropertyMemberService {
  constructor(
    private readonly prismaClient: PrismaService,

    private propertyMemberRepository: PropertyMemberRepository,
    private propertyRepository: PropertyRepository,
    private systemPropertyRepository: SystemPropertyRoleRepository,
    private globalRepository: GlobalRepository,
  ) {}

  /**
   * A tener en cuenta
   *
   * pretendemos enviar el siguiente modelo:
   *
   * (AUTH-RENT) -> microservicio de autenticacion
   * username, email, cellphone, fullname, identificationType, identification number
   *
   * (FINANCIAL -RENT) -> microservicio de propiedades
   * status, assignedAt
   */
  async getAllPropertyMemberByPropertyId(
    ownerUserPropertyId: string,
    propertyId: string,
    status: PropertyMemberStatus,
    paginationDto: PaginationType,
  ): Promise<PaginationResponse<GetAllUserData>> {
    //verificamos que dicho inmueble sea de dicho propietario
    const optOwnerProperty = await this.propertyRepository.findPropertyById(
      ownerUserPropertyId,
      propertyId,
    );

    if (!optOwnerProperty) {
      throw new PropertyNotFoundException();
    }

    //obtenemos la informacion parcial para despues unirla al del servidor
    const result = await this.prismaClient.$transaction(async (tx) => {
      const { data, metadata } = await this.propertyMemberRepository.findAll(
        tx,
        propertyId,
        status,
        paginationDto,
      );

      return { data, metadata };
    });

    //antes de unir la informacion del miembro de la propiedad con la informacion
    // personal de la person hay que limpiar las politicas de estos usuarios
    const propertyMemberCleanData = result.data.map((propertyMember) => ({
      ...propertyMember,
      policies: cleanPolicies(
        propertyMember.policies,
        propertyMember.overrides,
      ),
    }));
    //obtenemos la informacion completa dentro del otro microservicio
    // de autenticacion
    const userData = await getAllUsers(result.data.map((user) => user.userId));

    const unionInfo = unionInfoUser(propertyMemberCleanData, userData);

    return { data: unionInfo, metadata: result.metadata };
  }

  //invitacion de miembros en la propiedad
  async invitePropertyMembers(
    invitationReq: InvitePropertyMemberType,
  ): Promise<{ id: string; invitedEmailTo: string; message: string }> {
    //verificamos que el usuario sea propietario de dicho inmueble
    const optIsOwnerToProperty = await this.propertyRepository.findPropertyById(
      invitationReq.userId,
      invitationReq.propertyId,
    );

    if (!optIsOwnerToProperty) {
      throw new PropertyNotFoundException();
    }

    //llamamos al microservicio de auth para obtener la informacion del usuario del correo
    // para no despediciar el servicio de correos en una invitacion que no llegará a nada
    const { isEnabled, userId: invitedUserId } = await getUserData(
      invitationReq.email,
    );

    if (!isEnabled) {
      //hacemos algo si no esta activo dicho usuario
      throw new UserNotFound();
    }

    //si el usuario ya se encuentra registrado en la aplicacion enviamos el correo,
    // y despues guardaremos en la base de datos ya que, primero usar el servicio garantiza
    // de que si hay un error toda la funcionalidad no se ejecuta, asi evitamos escrituras
    // en la base de datos y evitar de que nunca el invitado reciba el correo.
    const invitationToken = generateSecureString(20);

    await sendInvitedEmailTo(
      invitationReq.email,
      invitationToken,
      optIsOwnerToProperty.propertyName,
    ); //enviamos el email

    const timestamp = Date.now() + 15 * 60 * 1000;
    const expirationTime = new Date(timestamp);
    //creamos la transaccion en la base de datos
    const invitation: createInvitationPropertyMemberType = {
      propertyId: invitationReq.propertyId,
      invitedBy: invitationReq.userId,
      invitedUserId,
      invitedEmailTo: invitationReq.email,
      status: 'DRAFT',
      token: invitationToken,
      expirationTime,
    };

    const { id, invitedEmailTo } =
      await this.globalRepository.saveInvitationLinked(invitation);

    return {
      id,
      invitedEmailTo,
      message: 'Email de invitacion enviado exitosamente!',
    };
  }

  async acceptPropertyMemberInvitation(
    token: string,
  ): Promise<{ message: string }> {
    const optInvitationLinked =
      await this.globalRepository.findPropertyInvitationByToken(token);

    if (!optInvitationLinked) {
      throw new InvitationLinkedNotFoundException();
    }

    //verificamos que cumpla con las condiciones para ser miembro en la propiedad
    validateInvitationLinked(optInvitationLinked);

    //creamos el property member ya que cumplio todos los requisitos para serlo
    await this.prismaClient.$transaction(async (tx) => {
      const newPropertyMember: PropertyMemberType = {
        userId: optInvitationLinked.invitedUserId,
        assignedBy: optInvitationLinked.invitedBy,
        propertyId: optInvitationLinked.propertyId,
        status: 'IN_PROCESS',
      };

      const { id: propertyMemberId } =
        await this.propertyMemberRepository.savePropertyMember(
          newPropertyMember,
          tx,
        );

      const propertyMemberRole: PropertyMemberRoleType = {
        propertyMemberId,
        propertyActorRoleId: TYPE_PROPERTY_ACTOR_ROLE_UUIDS.MIEMBRO,
      };

      await this.propertyMemberRepository.savePropertyMemberRole(
        propertyMemberRole,
        tx,
      );
    });

    return {
      message: 'Invitacion aceptada!, miembro en proceso de la propiedad',
    };
  }

  async assignmentRolesToMember(
    ownerId: string,
    propertyMemberId: string,
    propertyId: string,
    roles: PropertyActorRoleType[],
  ): Promise<{ message: string }> {
    //verificamos que seamos los dueños de la propiedad
    const optOwnerProperty = await this.propertyRepository.findPropertyById(
      ownerId,
      propertyId,
    );

    if (!optOwnerProperty) {
      throw new PropertyNotFoundException();
    }

    //existe el miembro en dicha propiedad
    const optPropertyMember =
      await this.propertyMemberRepository.findPropertyMemberWithRolesByPropertyMemberIdAndPropertyId(
        propertyMemberId,
        propertyId,
      );

    if (!optPropertyMember) {
      throw new PropertyMemberNotFound(propertyMemberId);
    }

    //no se puede añadir un rol a un estado de miembro desactivado
    if (!['IN_PROCESS', 'ACTIVE'].includes(optPropertyMember.status)) {
      throw new NotAllowedStatusByPropertyMemberException();
    }

    //nos aseguramos que dicho property member no tiene los mismos roles
    // que le quiere añadir el usuario
    const { propertyMemberRole, ...propertyMember } = optPropertyMember;

    const assignedRoles = new Set(roles);

    const exists = propertyMemberRole.some((role) =>
      assignedRoles.has(role.propertyActorRole.name as PropertyActorRoleType),
    );

    if (exists) {
      throw new AssingnmentStatusNotAllowedException();
    }

    await this.prismaClient.$transaction(async (tx) => {
      //asignamos los respectivos roles al dicho miembro de la propiedad y transicionamos su estado
      //de IN_PROCCESS a ACTIVE
      const rolesUuids = roles.map(
        (rol) => TYPE_PROPERTY_ACTOR_ROLE_UUIDS[rol],
      );
      //asignamos los distintos roles al usuario
      await this.propertyMemberRepository.savePropertyMemberWithRoles(
        propertyMember.id,
        rolesUuids,
        tx,
      );
    });

    //si el usuario esta el proceso de activacion pues lo activamos de lo contrario no lo hacemos
    if (optPropertyMember.status === 'IN_PROCESS') {
      //guardamos en la base de datos
      await this.propertyMemberRepository.updatePropertyMemberStatus(
        propertyMember.id,
        'ACTIVE',
      );
    }

    return {
      message:
        'el rol(es) han sido asignados correctamente al miembro de la propiedad',
    };
  }

  //este metodo permite a todos los miembros obtener sus respectivas propiedades
  // alas que estan vinculadas en estado ACTIVO o IN_PROCESS pero con informacion
  //limitada de la propiedad (nombre y descripcion)
  async getAllPropertiesByPropertyMemberId(
    userId: string,
    filter: PropertyMemberStatusFilter,
    paginationDto: PaginationType,
  ) {
    return await this.propertyRepository.findAllPartialPropertyInfoByPropertyMemberId(
      userId,
      filter.status,
      paginationDto,
    );
  }

  async getPropertyByPropertyMemberId(userId: string, propertyId: string) {
    const result =
      await this.propertyRepository.findPartialPropertyInfoByPropertyMemberId(
        userId,
        propertyId,
      );

    if (!result) {
      throw new PropertyNotFoundException();
    }

    return result;
  }

  async propertyMemberMe(
    propertyId: string,
    userId: string,
  ): Promise<PropertyMemberMe> {
    //buscamos si existe un property member vincullado a dicho user Id
    const optPropertyMember =
      await this.propertyMemberRepository.findPropertyMemberByUserIdAndPropertyId(
        userId,
        propertyId,
      );

    if (!optPropertyMember) {
      throw new PropertyMemberNotFound(userId);
    }

    const result = await this.prismaClient.$transaction(async (tx) => {
      const policies =
        await this.systemPropertyRepository.findAllPoliciesByPropertyMemberId(
          optPropertyMember.id,
          tx,
        );
      const roles =
        await this.systemPropertyRepository.findActorRolesByPropertyMemberId(
          optPropertyMember.id,
          tx,
        );
      const overrides =
        await this.systemPropertyRepository.findOverridePolicyByPropertyMemberId(
          optPropertyMember.id,
          tx,
        );

      return { policies, roles, overrides };
    });

    return {
      info: optPropertyMember,
      roles: result.roles,
      policies: result.policies
        ? cleanPolicies(result.policies, result.overrides)
        : [],
    };
  }
}
