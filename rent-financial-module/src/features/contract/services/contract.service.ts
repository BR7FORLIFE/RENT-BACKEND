import { Injectable } from '@nestjs/common';
import { ContractRepository } from '../repository/contract.repository.js';
import { PropertyRepository } from '../../property-registration/repository/property.repository.js';
import type { CreateContractType } from '../dtos/request-dto.js';
import type { ContractType } from '../schemas/contract.schema.js';
import { GlobalRepository } from '../../global/repository-global.js';
import { PropertyHelper } from '../../property-registration/services/helpers.service.js';
import {
  contractNotFound,
  propertyWithContractAvalibityException,
} from '../exceptions/exceptions.js';
import type { PropertyMemberRoleType } from '../../property-registration/schemas/property-registration.schema.js';
import { PrismaService } from '../../../core/database/prisma.service.js';
import { SystemPropertyService } from '../../system-property-role/services/system-property.service.js';
import {
  POLICIES_STATEMENTS_NAMES,
  TYPE_TENANT_ACTOR_ROLES_UUIDS,
} from '../../../types/global-types.js';
import type { ContractInfoResponse } from '../dtos/response-dto.js';
import { PropertyMemberRepository } from '../../property-registration/repository/property-member.repository.js';
import type { PaginationType } from '../../../shared/pagination/pagination-schemas.js';
import { PropertyNotFoundException } from '../../property-registration/exceptions/exceptions.js';
import type { NotificationType } from '../../global/global.schema.js';

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
    private readonly propertyHelperService: PropertyHelper,
    private readonly systemRole: SystemPropertyService,
    private readonly globalRepository: GlobalRepository,
  ) {}

  async createContract(
    userId: string,
    contract: CreateContractType,
  ): Promise<{ id: string; message: string }> {
    //buscamos el property member quien quiere realizar la accion de crear el contrato
    const optLandordPropertyMember =
      await this.systemRole.verifyPropertyMemberInPropertyId(
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
        contract.propertyId,
        optLandordPropertyMember.id,
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
      await this.systemRole.verifyPropertyMemberInPropertyId(
        contract.tenantMemberId,
        optProperty.id,
      );

    const result = await this.prismaClient.$transaction(async (tx) => {
      //asignamos el rol ARRENDADO al arrendado y asi obtener ciertas acciones dentro de
      //dicha propiedad
      const propertyTenantMemberRole: PropertyMemberRoleType = {
        propertyMemberId: tenantPropertyMember.id,
        propertyActorRoleId: TYPE_TENANT_ACTOR_ROLES_UUIDS.PRELIMINARY_TENANT,
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
        status: 'DRAFT',
        // si cambia el estado a PENDING o EXECUTION puede ser miembro activo del inmueble
        tenantMemberId: tenantPropertyMember.id,
      };

      const { id: contractId } = await this.contractRepository.saveContract(
        newContract,
        contract.resourcesImage,
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

  async getContractbyId(
    userId: string,
    propertyId: string,
    contractId: string,
  ): Promise<ContractInfoResponse> {
    //vemos si la persona actual es miembro de la propiedad
    const optPropertyMember =
      await this.systemRole.verifyPropertyMemberInPropertyId(
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
      await this.systemRole.verifyPropertyMemberInPropertyId(
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
