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

//Landord -> propietario
//Tenant ->  Arrendatatio (a)

@Injectable()
export class ContractService {
  constructor(
    private readonly contractRepository: ContractRepository,
    private readonly propertyRepository: PropertyRepository,
    private readonly globalRepository: GlobalRepository,
  ) {}

  async createContract(
    userId: string,
    contract: CreateContractType,
  ): Promise<{ id: string; message: string }> {
    const optProperty = await this.propertyRepository.findPropertyById(
      userId,
      contract.propertyId,
    );

    if (!optProperty) {
      throw new PropertyNotFoundException();
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
      await this.globalRepository.saveAssetResource(newResource);

    const newContract: ContractType = {
      // la idea es que si hay mas actores se pueda setear la id de quien genero el contracto
      createByUserId: userId,
      depositAmount: contract.depositAmount,
      endDate: contract.endDate,
      landlordMemberId: contract.landlordMemberId,
      monthlyRent: contract.monthlyRent,
      propertyId: optProperty.id,
      resourceImageId,
      startDate: contract.startDate,
      status: 'DRAFT',
      // si cambia el estado a PENDING o EXECUTION puede ser miembro activo del inmueble
      tenantMemberId: contract.tenantMemberId,
    };

    const { id } = await this.contractRepository.saveContract(newContract);

    return { id, message: 'contrato creado satisfactoriamente!' };
  }
}
