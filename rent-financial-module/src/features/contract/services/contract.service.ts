import { Injectable } from '@nestjs/common';
import { ContractRepository } from '../repository/contract.repository.js';
import { PropertyRepository } from '../../property-registration/repository/property.repository.js';
import type { CreateContractType } from '../dtos/request-dto.js';
import {
  PropertyMemberNotFound,
  PropertyNotFoundException,
} from '../../property-registration/exceptions/exceptions.js';
import type { ContractType } from '../schemas/contract.schema.js';
import { GlobalRepository } from '../../global/repository-global.js';
import { PropertyHelper } from '../../property-registration/services/helpers.service.js';
import type { PropertyActorRoleType } from '../../property-registration/types.js';
import {
  contractNotFound,
  propertyWithContractAvalibityException,
} from '../exceptions/exceptions.js';
import type {
  PropertyMemberRoleType,
  PropertyMemberType,
} from '../../property-registration/schemas/property-registration.schema.js';
import { PrismaService } from '../../../core/database/prisma.service.js';
import { TYPE_PROPERTY_ACTOR_ROLE_UUIDS } from '../../../types/global-types.js';
import type { ContractInfoResponse } from '../dtos/response-dto.js';
import { PropertyMemberRepository } from '../../property-registration/repository/property-member.repository.js';

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
      await this.propertyMemberRepository.findPropertyMemberByUserIdAndPropertyId(
        contract.landlordMemberId,
        optProperty.id,
      );

    if (!landordPropertyMember) {
      throw new PropertyMemberNotFound(contract.landlordMemberId);
    }

    //verificamos que el propietario o el usuario que registro la vivienda
    //sea propietario activo del inmueble
    const actorRoleByLandord = (
      await this.propertyMemberRepository.findActorRoleByUserId(
        contract.landlordMemberId,
      )
    ).map((role) => role.name as PropertyActorRoleType);

    //esto lanzara una excepcion sino cumple con el actor role
    this.propertyHelperService.IsActorRole('LANDLORD', actorRoleByLandord);

    //verificamos que el arrendatario no tenga el actor role de tenant
    // pq para cada vivienda hay una sola persona a quien se le hace el contrato
    const actorRoleByTenant = (
      await this.propertyMemberRepository.findActorRoleByUserId(
        contract.tenantMemberId,
      )
    ).map((role) => role.name as PropertyActorRoleType);

    this.propertyHelperService.IsActorRole('TENANT', actorRoleByTenant, false); //no puede haber ese rol

    const result = await this.prismaClient.$transaction(async (tx) => {
      //registramos el usuario como tenant en la vivienda
      const propertyMember: PropertyMemberType = {
        userId: contract.tenantMemberId,
        assignedBy: userId,
        propertyId: contract.propertyId,
        status: 'ACTIVE',
      };

      const { id: tenantPropertyMemberId } =
        await this.propertyMemberRepository.savePropertyMember(
          propertyMember,
          tx,
        );

      const propertyTenantMemberRole: PropertyMemberRoleType = {
        propertyMemberId: tenantPropertyMemberId,
        propertyActorRoleId: TYPE_PROPERTY_ACTOR_ROLE_UUIDS.TENANT,
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
        tenantMemberId: tenantPropertyMemberId,
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
    propertyMemberId: string,
    contractId: string,
  ): Promise<ContractInfoResponse> {
    const data = await this.contractRepository.findContractById(
      propertyMemberId,
      contractId,
    );

    if (!data) {
      throw new contractNotFound();
    }

    return data;
  }
}
