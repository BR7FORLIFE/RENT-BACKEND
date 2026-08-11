import { Injectable } from '@nestjs/common';
import type { PropertyInfoPersistence } from '../repository-types.js';
import type { Property } from '../../dtos/response-dto.js';

@Injectable()
export class PropertyServiceMapper {
  toDomain(propertyEntity: PropertyInfoPersistence): Property {
    const {
      direction,
      economicInfoResponse,
      structureInfoResponse,
      resourceImages,
      ...property
    } = propertyEntity;

    return {
      ...property,
      createAt: property.createAt.toString(),
      direction: direction
        ? {
            ...direction,
            latitute: direction.latitute.toNumber(),
            longitud: direction.longitud.toNumber(),
            createAt: direction.createAt.toString(),
            updateAt: direction.updateAt.toString(),
          }
        : null,
      economicInfoResponse: economicInfoResponse
        ? {
            ...economicInfoResponse,
            monthlyRent: economicInfoResponse.monthlyRent.toNumber(),
            depositAmount: economicInfoResponse.depositAmount.toNumber(),
          }
        : null,
      structureInfoResponse: structureInfoResponse
        ? {
            ...structureInfoResponse,
            area: structureInfoResponse.area.toNumber(),
            lotArea: structureInfoResponse.area.toNumber(),
          }
        : null,
      resourcesImages: resourceImages.map((resource) => ({
        ...resource,
        createAt: resource.createAt.toString(),
        updateAt: resource.updateAt.toString(),
      })),
    };
  }
}
