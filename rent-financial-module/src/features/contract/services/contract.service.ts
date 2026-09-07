import { Injectable } from '@nestjs/common';
import { ContractRepository } from '../repository/contract.repository.js';
import { PropertyRepository } from '../../property-registration/repository/property.repository.js';
import type {
  changeContractStatusType,
  CreateContractType,
  GenerateContractDraftType,
} from '../dtos/request-dto.js';
import type { ContractType } from '../schemas/contract.schema.js';
import { GlobalRepository } from '../../global/repository-global.js';
import {
  contractDraftNotFound,
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
//import type { GenerateIAContractFields } from './helper.service.js';

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

  //contract drafts
  // async generateIAContractContent() {
  //   const promptData: GenerateIAContractFields = {};
  // }

  //este metodo permitira crear borradores de contratos para sugerir al miembro con
  //la politica de generacion de contratos que puede editar modificar para enviar y asi
  // el interesado en la vivienda pueda aceptarlo o rechazarlo
  async generateContractDraft(
    userId: string,
    contractDraft: GenerateContractDraftType,
  ): Promise<{
    id: string;
    version: number;
    message: string;
    createAt: string;
  }> {
    //verficamos que sea un miembro activo en la app
    const optPropertyMember =
      await this.systemRole.verifyPropertyMemberByUserIdInPropertyId(
        userId,
        contractDraft.propertyId,
      );

    //verificamos que tambien tenga las politicas de registros de contratos
    await this.systemRole.CheckPolicies(optPropertyMember.id, [
      POLICIES_STATEMENTS_NAMES.REGISTRAR_CONTRATOS,
    ]);

    //verificamos que exista la propiedad con el landlord ID
    const optProperty =
      await this.propertyRepository.findPropertyByIdAndPropertyMemberId(
        optPropertyMember.id,
        contractDraft.propertyId,
      );

    if (!optProperty) {
      throw new PropertyNotFoundException();
    }

    //verificamos que el arrendado sea un miembro activo en la propiedad
    const optTenantPropertyMember =
      await this.systemRole.verifyPropertyMemberByIdAndPropertyId(
        contractDraft.tenantMemberId,
        optProperty.id,
      );

    //encontramos la ultima version del borrador del contrato
    const version =
      await this.contractRepository.findLastVersionInContractDraft(
        optProperty.id,
      );

    //creamos el borrador de contrato
    const savedDraft = await this.contractRepository.saveContractDraft({
      content: contractDraft.content,
      version,
      landlordAgreed: false,
      tenantAgreed: false,
      createdByPropertyMemberId: optPropertyMember.id,
      propertyId: optProperty.id,
      landlordMemberId: contractDraft.landlordMemberId,
      tenantMemberId: optTenantPropertyMember.id,
      monthlyRent: contractDraft.monthlyRent,
      depositAmount: contractDraft.depositAmount,
      startDate: contractDraft.startDate,
      endDate: contractDraft.endDate,
    });

    //notificamos a los actores dentro del contrato para que se enteren de la
    //nueva version o borrador del contrato
    const landlordNotification: NotificationType = {
      content: `Un nuevo borrador de contrato para la vivienda ${optProperty.propertyName} ha sido generado!`,
      name: 'Borrador de contrato',
      receiverId: contractDraft.landlordMemberId,
      source: 'CONTRACT_SERVICE',
      transmitterId: optPropertyMember.id,
      type: 'INFO',
    };

    const tenantNotification: NotificationType = {
      content: `Un nuevo borrador de contrato para la vivienda ${optProperty.propertyName} ha sido generado!`,
      name: 'Borrador de contrato',
      receiverId: contractDraft.tenantMemberId,
      source: 'CONTRACT_SERVICE',
      transmitterId: optPropertyMember.id,
      type: 'INFO',
    };

    //guardamos las respectivas notificaciones
    await this.prismaClient.$transaction(async (tx) => {
      await this.globalRepository.saveNotification(landlordNotification, tx);
      await this.globalRepository.saveNotification(tenantNotification, tx);
    });

    return {
      id: savedDraft.id,
      version: savedDraft.version,
      message: 'borrador generado correctamente!',
      createAt: Date.toString(),
    };
  }

  async getAllContractDraft(
    userId: string,
    propertyId: string,
    paginationDto: PaginationType,
  ) {
    //verificamos que sea un miembro valido en la propiedad
    const optPropertyMember =
      await this.systemRole.verifyPropertyMemberByUserIdInPropertyId(
        userId,
        propertyId,
      );

    //verificamos que tenga la politica para leer contratos
    await this.systemRole.CheckPolicies(optPropertyMember.id, [
      POLICIES_STATEMENTS_NAMES.VER_CONTRATOS,
    ]);

    return await this.contractRepository.findAllContractDraftByPropertyId(
      propertyId,
      paginationDto,
    );
  }

  async getContractDraftById(
    userId: string,
    contractDraftId: string,
    propertyId: string,
  ) {
    //primero verificamos que el mimebro pertenezca en el inmueble
    const optPropertyMember =
      await this.systemRole.verifyPropertyMemberByUserIdInPropertyId(
        userId,
        propertyId,
      );

    //verificamos politicas
    await this.systemRole.CheckPolicies(optPropertyMember.id, [
      POLICIES_STATEMENTS_NAMES.VER_CONTRATOS,
    ]);

    //retornamos el draft del contrato
    const optContractDraft =
      await this.contractRepository.findContractDraftByIdAndPropertyId(
        contractDraftId,
        propertyId,
      );

    if (!optContractDraft) {
      throw new contractDraftNotFound();
    }

    return optContractDraft;
  }

  //metodo para que ambas partes en el contrato esten de acuerdo en el borrador para proceder con el
  //juridico
  async agreeContractDraft() {}

  //contracts
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
        contractId,
        propertyId,
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
  async handleContractStatus(
    userId: string,
    contractId: string,
    contractStatus: changeContractStatusType,
    propertyId: string,
  ): Promise<{ contractId: string; message: string }> {
    //verificamos que sea un miembro de la propiedad
    const optPropertyMember =
      await this.systemRole.verifyPropertyMemberByUserIdInPropertyId(
        userId,
        propertyId,
      );

    const optContract =
      await this.contractRepository.findContractByIdAndPropertyId(
        contractId,
        propertyId,
      );

    if (!optContract) {
      throw new contractNotFound();
    }

    //tenemos que verificar si el miembro actual tiene permisos para
    //cambiar el estado del contrato segun el tipo, ya que no basta con que cumpla
    //algunas de las politicas sino que debe permitir lo necesario para cada contract status
    switch (contractStatus.status) {
      case 'FINISHED':
        await this.systemRole.CheckPolicies(optPropertyMember.id, [
          POLICIES_STATEMENTS_NAMES.FINALIZAR_CONTRATOS,
        ]);

        //actualizamos el estado del contrato a FINALIZADO
        await this.contractRepository.updateStatusContractById(
          contractId,
          'FINISHED',
        );
        break;

      case 'SUSPENDED':
        await this.systemRole.CheckPolicies(optPropertyMember.id, [
          POLICIES_STATEMENTS_NAMES.SUSPENDER_CONTRATOS,
        ]);

        await this.contractRepository.updateStatusContractById(
          contractId,
          'SUSPENDED',
        );
        break;
    }

    return {
      contractId: optContract.id,
      message: 'estado del contrato cambiado exitosamente!',
    };
  }

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
      contractId,
      propertyId,
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
}
