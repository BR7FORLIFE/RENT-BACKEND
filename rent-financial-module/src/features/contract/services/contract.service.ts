import { Injectable } from '@nestjs/common';
import { ContractRepository } from '../repository/contract.repository.js';
import { PropertyRepository } from '../../property-registration/repository/property.repository.js';
import type { CreateContractType } from '../dtos/request-dto.js';
import {
  PropertyMemberNotFound,
  PropertyNotFoundException,
} from '../../property-registration/exceptions/exceptions.js';
import type { ContractType } from '../schemas/contract.schema.js';
import type { createResourceImageType } from '../../property-registration/dtos/request-dto.js';
import { GlobalRepository } from '../../global/repository-global.js';
import { PropertyHelper } from '../../property-registration/services/helpers.service.js';
import type { PropertyActorRoleType } from '../../property-registration/types.js';
import { propertyWithContractAvalibityException } from '../exceptions/exceptions.js';
import type {
  PropertyMemberRoleType,
  PropertyMemberType,
} from '../../property-registration/schemas/property-registration.schema.js';
import { PrismaService } from '../../../core/database/prisma.service.js';
import { TYPE_PROPERTY_ACTOR_ROLE_UUIDS } from '../../../types/global-types.js';

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
      await this.propertyRepository.findPropertyMemberByUserIdAndPropertyId(
        contract.landlordMemberId,
        optProperty.id,
      );

    if (!landordPropertyMember) {
      throw new PropertyMemberNotFound(contract.landlordMemberId);
    }

    //verificamos que el propietario o el usuario que registro la vivienda
    //sea propietario activo del inmueble
    const actorRoleByLandord = (
      await this.propertyRepository.findActorRoleByUserId(
        contract.landlordMemberId,
      )
    ).map((role) => role.name as PropertyActorRoleType);

    //esto lanzara una excepcion sino cumple con el actor role
    this.propertyHelperService.IsActorRole('LANDLORD', actorRoleByLandord);

    //verificamos que el arrendatario no tenga el actor role de tenant
    // pq para cada vivienda hay una sola persona a quien se le hace el contrato
    const actorRoleByTenant = (
      await this.propertyRepository.findActorRoleByUserId(
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
      };

      const { id: tenantPropertyMemberId } =
        await this.propertyRepository.savePropertyMember(propertyMember, tx);

      const propertyTenantMemberRole: PropertyMemberRoleType = {
        propertyMemberId: tenantPropertyMemberId,
        propertyActorRoleId: TYPE_PROPERTY_ACTOR_ROLE_UUIDS.TENANT,
      };

      await this.propertyRepository.savePropertyMemberRole(
        propertyTenantMemberRole,
        tx,
      );

      //creamos los recursos en este caso archivos de contratos
      const newResource: createResourceImageType = {
        url: contract.resourceImage.url,
        assetId: contract.resourceImage.assetId,
        format: contract.resourceImage.format,
        height: contract.resourceImage.height,
        secureUrl: contract.resourceImage.secureUrl,
        width: contract.resourceImage.width,
      };

      const { id: resourceImageId } =
        await this.globalRepository.saveAssetResource(newResource, tx);

      const newContract: ContractType = {
        // la idea es que si hay mas actores se pueda setear la id de quien genero el contracto
        createByUserId: userId,
        depositAmount: contract.depositAmount,
        endDate: contract.endDate,
        landlordMemberId: landordPropertyMember.id,
        monthlyRent: contract.monthlyRent,
        propertyId: optProperty.id,
        resourceImageId,
        startDate: contract.startDate,
        status: 'DRAFT',
        // si cambia el estado a PENDING o EXECUTION puede ser miembro activo del inmueble
        tenantMemberId: tenantPropertyMemberId,
      };

      const { id: contractId } = await this.contractRepository.saveContract(
        newContract,
        tx,
      );

      return { contractId };
    });

    return {
      id: result.contractId,
      message: 'contrato creado satisfactoriamente!',
    };
  }
}
