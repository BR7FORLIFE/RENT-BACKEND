import { Injectable } from '@nestjs/common';
import { ContractRepository } from '../repository/contract.repository.js';
import { PropertyRepository } from '../../property-registration/repository/property.repository.js';
import type { CreateContractType } from '../dtos/request-dto.js';
import type { ContractType } from '../schemas/contract.schema.js';
import { GlobalRepository } from '../../global/repository-global.js';
import {
  contractNotFound,
  deniedTransitionedStatusContract,
  propertyWithContractAvalibityException,
} from '../exceptions/exceptions.js';
import type { PropertyMemberRoleType } from '../../property-registration/schemas/property-registration.schema.js';
import { PrismaService } from '../../../core/database/prisma.service.js';
import { SystemPropertyService } from '../../system-property-role/services/system-property.service.js';
import { SystemPropertyRoleRepository } from '../../system-property-role/repository/sytem-property-role.repository.js';
import {
  POLICIES_STATEMENTS_NAMES,
  TYPE_TENANT_ACTOR_ROLES_UUIDS,
} from '../../../types/global-types.js';
import type { ContractInfoResponse } from '../dtos/response-dto.js';
import { PropertyMemberRepository } from '../../property-registration/repository/property-member.repository.js';
import type { PaginationType } from '../../../shared/pagination/pagination-schemas.js';
import { PropertyNotFoundException } from '../../property-registration/exceptions/exceptions.js';
import type { NotificationType } from '../../global/global.schema.js';
import type { createResourceImageType } from '../../global/global.schema-dtos.js';

// estos dos actores importantes en los contratos son miembros activos
//dentro de la propiedad

//Landord -> propietario
//Tenant ->  Arrendatario (a)

@Injectable()
export class ContractService {
  constructor(
    private readonly prismaClient: PrismaService,
    private readonly contractRepository: ContractRepository,
    private readonly propertyRepository: PropertyRepository,
    private readonly propertyMemberRepository: PropertyMemberRepository,
    private readonly systemRole: SystemPropertyService,
    private readonly systemRoleRepository: SystemPropertyRoleRepository,
    private readonly globalRepository: GlobalRepository,
  ) {}

  async createContract(
    userId: string,
    contract: CreateContractType,
  ): Promise<{ id: string; message: string }> {
    //buscamos el property member quien quiere realizar la accion de crear el contrato
    const optLandordPropertyMember =
      await this.systemRole.verifyPropertyMemberByUserIdInPropertyId(
        userId,
        contract.propertyId,
      );

    //verificamos que la persona quien vaya a crear el contrato tenga la politica para crearlo
    await this.systemRole.CheckPolicies(optLandordPropertyMember.id, [
      POLICIES_STATEMENTS_NAMES.REGISTRAR_CONTRATOS,
    ]);

    //verficamos que la propiedad exista!
    const optProperty =
      await this.propertyRepository.findPropertyByIdAndPropertyMemberId(
        optLandordPropertyMember.id,
        contract.propertyId,
      );

    if (!optProperty) {
      throw new PropertyNotFoundException();
    }
    //verificamos que no tenga un contrato activo de arrendamiento la vivienda
    const iscurrentContract =
      await this.contractRepository.findContractByStatusContractAndPropertyId(
        'ACTIVE',
        optProperty.id,
      );

    //lanzamos la excepcion ya que no puede haber un contrato vigente si se quiere crear otro
    if (iscurrentContract) {
      throw new propertyWithContractAvalibityException();
    }

    //validamos si el posible arrendado pertenecen a dicho inmueble
    const tenantPropertyMember =
      await this.systemRole.verifyPropertyMemberByIdAndPropertyId(
        contract.tenantMemberId,
        optProperty.id,
      );

    const result = await this.prismaClient.$transaction(async (tx) => {
      //asignamos el rol ARRENDADO al arrendado y asi obtener ciertas acciones dentro de
      //dicha propiedad
      const propertyTenantMemberRole: PropertyMemberRoleType = {
        propertyMemberId: tenantPropertyMember.id,
        propertyActorRoleId: TYPE_TENANT_ACTOR_ROLES_UUIDS.ARRENDADO_PRELIMINAR,
      };

      await this.propertyMemberRepository.savePropertyMemberRole(
        propertyTenantMemberRole,
        tx,
      );

      const newContract: ContractType = {
        // la idea es que si hay mas actores se pueda setear la id de quien genero el contracto
        createByUserId: userId,
        depositAmount: contract.depositAmount,
        endDate: contract.endDate,
        landlordMemberId: optLandordPropertyMember.id,
        monthlyRent: contract.monthlyRent,
        propertyId: optProperty.id,
        startDate: contract.startDate,
        status: 'PENDING_ACCEPTANCE',
        // si cambia el estado a PENDING o EXECUTION puede ser miembro activo del inmueble
        tenantMemberId: tenantPropertyMember.id,
      };

      const { id: contractId } = await this.contractRepository.saveContract(
        newContract,
        contract.resources,
        tx,
      );
      //enviamos la notificacion al posible arrendado para que se entere y decida
      // si rechazar o aceptar que se continue el proceso de contratamiento

      const notificationTenantInfo: NotificationType = {
        content:
          'Se ha creado un borrador de contrato y se encuentra a la espera de rechazo o aceptación',
        name: 'CREACIÓN DE CONTRATO EN VIGENCIA!',
        transmitterId: userId,
        receiverId: optLandordPropertyMember.id,
        source: 'CONTRACT_SERVICE',
        type: 'INFO',
      };

      await this.globalRepository.saveNotification(notificationTenantInfo, tx);

      return { contractId };
    });

    return {
      id: result.contractId,
      message: 'contrato creado satisfactoriamente!',
    };
  }

  async AcceptedOrRejectedContractByTenant(
    contractId: string,
    propertyId: string,
    tenantId: string,
    status: 'ACCEPTED' | 'REJECTED',
  ): Promise<{ contractId: string; message: string }> {
    //verificamos que sea un miembro activo en la propiedad
    const tenantPropertyMember =
      await this.systemRole.verifyPropertyMemberByUserIdInPropertyId(
        tenantId,
        propertyId,
      );

    //verificamos si existe dicho contrato
    const optContract =
      await this.contractRepository.findContractByIdAndTenantMemberId(
        contractId,
        tenantId,
      );

    if (!optContract) {
      throw new contractNotFound();
    }

    //verificamos que el contrato no este RECHAZADO, CANCELADO, SUSPENDIDO
    // FINALIZADO porque no queremos modificar el estado del contrato si cuenta
    // con estos estados previos
    if (!['PENDING_ACCEPTANCE'].includes(optContract.status)) {
      throw new deniedTransitionedStatusContract();
    }

    if (status === 'ACCEPTED') {
      await this.prismaClient.$transaction(async (tx) => {
        //actualizamos el estado del contrato pendiente
        await this.contractRepository.updateStatusContractByTenantId(
          contractId,
          tenantPropertyMember.id,
          'PENDING_DOCUMENTATION',
          tx,
        );

        //y ademas muy importante pasamos su rol a ARRENDADO
        await this.systemRoleRepository.updatePropertyActorRole(
          tenantPropertyMember.id,
          TYPE_TENANT_ACTOR_ROLES_UUIDS.ARRENDADO_PRELIMINAR,
          TYPE_TENANT_ACTOR_ROLES_UUIDS.ARRENDADO,
        );
      });

      return {
        contractId: optContract.id,
        message: 'Contrato aceptado exitosamente!',
      };
    } else {
      await this.contractRepository.updateStatusContractByTenantId(
        contractId,
        tenantPropertyMember.id,
        'REJECTED',
      );
    }

    return {
      contractId: optContract.id,
      message: 'Contrato rechazado correctamente',
    };
  }

  async loadContractDocumentation(
    userId: string,
    propertyId: string,
    contractId: string,
    contractResources: createResourceImageType[],
  ): Promise<{ contractId: string; message: string }> {
    //primero validamos que sea un property member
    const optPropertyMember =
      await this.systemRole.verifyPropertyMemberByUserIdInPropertyId(
        userId,
        propertyId,
      );

    //verificamos que tengan las policiticas necesarias para subir documentos
    //referentes a los contratos
    await this.systemRole.CheckPolicies(optPropertyMember.id, [
      POLICIES_STATEMENTS_NAMES.SUBIR_DOCUMENTOS_CONTRATO,
    ]);

    //verificamos que exista dicho contrato
    const optContract =
      await this.contractRepository.findContractByIdAndPropertyId(
        propertyId,
        contractId,
      );

    if (!optContract) {
      throw new contractNotFound();
    }

    //verificamos que el contrato este en un estado de PENDING_DOCUMENTATION
    //para poder realizar la operacion correctamente, caso contrario no será
    //permitido ya que indica que el arrendado no aceptó el contrato
    if (optContract.status !== 'PENDING_DOCUMENTATION') {
      throw new deniedTransitionedStatusContract();
    }

    await this.prismaClient.$transaction(async (tx) => {
      //cargamos los documentos enlazando con la id de contrato
      await this.contractRepository.saveContractResourcesByContractId(
        optContract.id,
        contractResources,
        tx,
      );

      //actualizamos el esatdo del contrato a ACTIVE
      await this.contractRepository.updateStatusContractById(
        optContract.id,
        'ACTIVE',
        tx,
      );
    });

    return {
      contractId,
      message: 'Documentos cargados exitosamente en el contrato',
    };
  }

  //este metodo nos permitira cambiar de estado un contrato
  async handleContractStatus() {}

  async getContractbyId(
    userId: string,
    propertyId: string,
    contractId: string,
  ): Promise<ContractInfoResponse> {
    //vemos si la persona actual es miembro de la propiedad
    const optPropertyMember =
      await this.systemRole.verifyPropertyMemberByUserIdInPropertyId(
        userId,
        propertyId,
      );

    //verificamos que dicho miembro tenga la politica de VER_CONTRATOS para
    // asi tener la informacion del contrato que quiere revisar
    await this.systemRole.CheckPolicies(optPropertyMember.id, [
      POLICIES_STATEMENTS_NAMES.VER_CONTRATOS,
    ]);

    const data = await this.contractRepository.findContractByIdAndPropertyId(
      propertyId,
      contractId,
    );

    if (!data) {
      throw new contractNotFound();
    }

    return data;
  }

  async getAllContracts(
    userId: string,
    propertyId: string,
    paginationDto: PaginationType,
  ) {
    //validamos si es miembro de la propiedad actual
    const optPropertyMember =
      await this.systemRole.verifyPropertyMemberByUserIdInPropertyId(
        userId,
        propertyId,
      );

    //validamos que tenga las politicas de ver contratos
    await this.systemRole.CheckPolicies(optPropertyMember.id, [
      POLICIES_STATEMENTS_NAMES.VER_CONTRATOS,
    ]);

    return await this.contractRepository.findAllContractByPropertyId(
      propertyId,
      paginationDto,
    );
  }

  // async editContract(userId: string, contractId: string) {}

  async generateIAContractContent() {}
}
