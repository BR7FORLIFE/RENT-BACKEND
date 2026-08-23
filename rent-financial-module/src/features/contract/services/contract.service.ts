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
import {
  contractNotFound,
  propertyWithContractAvalibityException,
} from '../exceptions/exceptions.js';
import type {
  PropertyMemberRoleType,
  PropertyMemberType,
} from '../../property-registration/schemas/property-registration.schema.js';
import { PrismaService } from '../../../core/database/prisma.service.js';
import { TYPE_TENANT_ACTOR_ROLES_UUIDS } from '../../../types/global-types.js';
import type { ContractInfoResponse } from '../dtos/response-dto.js';
import { PropertyMemberRepository } from '../../property-registration/repository/property-member.repository.js';
import type { PaginationType } from '../../../shared/pagination/pagination-schemas.js';

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
        propertyActorRoleId: TYPE_TENANT_ACTOR_ROLES_UUIDS.ARRENDADO,
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

  async getAllContracts(
    userId: string,
    propertyId: string,
    paginationDto: PaginationType,
  ) {
    //validamos que dicho usuario es el dueño de la propiedad
    const optProperty = await this.propertyRepository.findPropertyById(
      userId,
      propertyId,
    );

    if (!optProperty) {
      throw new PropertyNotFoundException();
    }

    return await this.contractRepository.findAllContractByPropertyId(
      propertyId,
      paginationDto,
    );
  }
}
