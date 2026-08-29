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
import {
  POLICIES_STATEMENTS_NAMES,
  TYPE_TENANT_ACTOR_ROLES_UUIDS,
} from '../../../types/global-types.js';
import type { ContractInfoResponse } from '../dtos/response-dto.js';
import { PropertyMemberRepository } from '../../property-registration/repository/property-member.repository.js';
import type { PaginationType } from '../../../shared/pagination/pagination-schemas.js';
import { PropertyNotFoundException } from '../../property-registration/exceptions/exceptions.js';
import type { SystemPropertyService } from '../../system-property-role/services/system-property.service.js';

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
    //verficamos que la propiedad exista! por el creador o propietario
    const optProperty = await this.propertyRepository.findPropertyById(
      userId,
      contract.propertyId,
    );

    if (!optProperty) {
      throw new PropertyNotFoundException();
    }
    //verificamos que no tenga un contrato activo de arrendamiento la vivienda
    const iscurrentContract =
      await this.contractRepository.findContractByStatusContractAndPropertyId(
        'EXECUTION',
        optProperty.id,
      );

    //lanzamos la excepcion ya que no puede haber un contrato vigente si se quiere crear otro
    if (iscurrentContract) {
      throw new propertyWithContractAvalibityException();
    }

    //validamos si los miembros pertenecen a dicho inmueble menos la persona interesada en la casa
    // ya que hará parte del inmueble si esta en un estado PENDING o EXECUTION
    const landordPropertyMember =
      await this.systemRole.verifyPropertyMemberInPropertyId(
        contract.landlordMemberId,
        optProperty.id,
      );

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
        landlordMemberId: landordPropertyMember.id,
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
