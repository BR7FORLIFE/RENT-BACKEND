import { Injectable } from '@nestjs/common';
import type {
  CreatePropertyType,
  PropertyMemberRoleType,
  PropertyMemberType,
  PropertyType,
} from '../schemas/property-registration.schema.js';
import { PropertyRepository } from '../repository/property.repository.js';
import {
  PropertyActorRoleNotFoundException,
  PropertyAlreadyRegisterException,
  PropertyNotFoundException,
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
      userId,
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

    //registramos el recurso para la vivienda que se quiere crear
    const { id: resourceImageId } = await this.repository.saveAssetResource(
      propertyDto.resourceImage,
    );

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
      propertyDescription: propertyDto.propertyDescription,
      propertyName: propertyDto.propertyName,
      resourceImageId: resourceImageId,
    };

    const { id: propertyId } = await this.repository.saveProperty(newProperty);

    //creamos el MemberRole ya que el usuario que digita un inmueble
    // posee un ROL de Arrendador o muchos mas
    const propertyMember: PropertyMemberType = {
      userId,
      assignedBy: userId,
      propertyId,
    };

    const { id: propertyMemberId } =
      await this.repository.savePropertyMember(propertyMember);

    //creamos el ProperyMemberRole para saber el rol de dicho
    //recuperamos el id del role LANDORD

    const propertyActorRole =
      await this.repository.findPropertyActorRoleByName('LANDLORD');

    if (!propertyActorRole) {
      new PropertyActorRoleNotFoundException();
    }

    //guardamos la informacion del usuario con rol en propertyMemberRole
    const propertyMemberRole: PropertyMemberRoleType = {
      propertyMemberId,
      propertyActorRoleId: propertyActorRole!.id,
    };

    await this.repository.savePropertyMemberRole(propertyMemberRole);

    return { id: propertyId, message: 'propiedad registrada exitosamente!' };
  }

  async consultAllProperties(
    userId: string,
    paginationDto: PaginationType,
  ): Promise<PaginationResponse<PropertyInfoResponse>> {
    return await this.repository.findAll(userId, paginationDto);
  }

  async consultPropertyById(userId: string, id: string) {
    const data = await this.repository.findPropertyById(userId, id);

    if (!data) {
      throw new PropertyNotFoundException();
    }

    return data;
  }
}
