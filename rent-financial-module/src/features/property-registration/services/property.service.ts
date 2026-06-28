import { Injectable } from '@nestjs/common';
import type {
  CreatePropertyType,
  PropertyType,
} from '../schemas/property-registration.schema.js';
import { PropertyRepository } from '../repository/property.repository.js';
import {
  PropertyAlreadyRegisterException,
  PropertyOccupationTypeNotFoundException,
  TypePropertyNotFoundException,
} from '../exceptions/exceptions.js';
import type {
  PaginationResponse,
  PaginationType,
} from '../../../shared/pagination/pagination-schemas.js';
import type { PropertyInfoResponse } from '../dtos/response/response-dto.js';

@Injectable()
export class PropertyService {
  constructor(private readonly repository: PropertyRepository) {}

  async registerProperty(
    userId: string,
    propertyDto: CreatePropertyType,
  ): Promise<{ id: string; message: string }> {
    //primero verificamos si la propiedad  no ha sido registrado
    const exists = await this.repository.findByFMIOrPredialNumber(
      propertyDto.fmi,
      propertyDto.predialNumber,
    );

    if (exists) {
      throw new PropertyAlreadyRegisterException();
    }

    //creamos la direccion del inmueble
    const { id: directionId } = await this.repository.saveDirection(
      propertyDto.direction,
    );

    //buscamos la id asociada al PropertyOccupationType
    const occupationType =
      await this.repository.findPropertyOccupationTypeByName(
        propertyDto.propertyOccupationType,
      );

    if (!occupationType) {
      throw new PropertyOccupationTypeNotFoundException();
    }

    //buscamos la id del tipo de propiedad
    const typeProperty = await this.repository.findTypePropertyByName(
      propertyDto.propertyType,
    );

    if (!typeProperty) {
      throw new TypePropertyNotFoundException();
    }

    //registramos el inmueble
    const newProperty: PropertyType = {
      userId,
      directionId,
      fmi: propertyDto.fmi,
      isPublished: false,
      predialNumber: propertyDto.predialNumber,
      propertyOccupationTypeId: occupationType.id,
      propertyTypeId: typeProperty.id,
      registerByUserId: userId,
    };

    const { id } = await this.repository.saveProperty(newProperty);

    return { id, message: 'propiedad registrada exitosamente!' };
  }

  async consultAllProperties(
    userId: string,
    paginationDto: PaginationType,
  ): Promise<PaginationResponse<PropertyInfoResponse>> {
    return await this.repository.findAll(userId, paginationDto);
  }
}
