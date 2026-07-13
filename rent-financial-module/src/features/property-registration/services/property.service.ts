import { Injectable } from '@nestjs/common';
import type {
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
import type { PropertyInfoResponse } from '../dtos/response-dto.js';
import { PropertyHelper } from './helpers.service.js';
import type {
  CreatePropertyType,
  createResourceImageType,
  EditingPropertyType,
} from '../dtos/request-dto.js';
import type { Prisma } from '../../../../generated/prisma/client.js';
import type { PropertyOccupationType, TypePropertyType } from '../types.js';
import { GlobalRepository } from '../../global/repository-global.js';

@Injectable()
export class PropertyService {
  constructor(
    private readonly helper: PropertyHelper,
    private readonly propertyRepository: PropertyRepository,
    private readonly globalRepository: GlobalRepository,
  ) {}

  async registerProperty(
    userId: string,
    propertyDto: CreatePropertyType,
  ): Promise<{ id: string; message: string }> {
    //primero verificamos si la propiedad  no ha sido registrado
    const exists = await this.propertyRepository.findByFMIOrPredialNumber(
      userId,
      propertyDto.fmi,
      propertyDto.predialNumber,
    );

    if (exists) {
      throw new PropertyAlreadyRegisterException();
    }

    //creamos la direccion del inmueble
    const { id: directionId } = await this.globalRepository.saveDirection(
      propertyDto.direction,
    );

    //buscamos la id asociada al PropertyOccupationType
    const occupationType =
      await this.propertyRepository.findPropertyOccupationTypeByName(
        propertyDto.propertyOccupationType,
      );

    if (!occupationType) {
      throw new PropertyOccupationTypeNotFoundException();
    }

    //buscamos la id del tipo de propiedad
    const typeProperty = await this.propertyRepository.findTypePropertyByName(
      propertyDto.propertyType,
    );

    if (!typeProperty) {
      throw new TypePropertyNotFoundException();
    }

    //registramos el inmueble y guardamos los recursos correspondientes a la vivienda
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
    };

    const { id: propertyId } = await this.propertyRepository.saveProperty(
      newProperty,
      propertyDto.resourcesImages,
    );

    //creamos el MemberRole ya que el usuario que digita un inmueble
    // posee un ROL de Arrendador o muchos mas
    const propertyMember: PropertyMemberType = {
      userId,
      assignedBy: userId,
      propertyId,
    };

    const { id: propertyMemberId } =
      await this.propertyRepository.savePropertyMember(propertyMember);

    //creamos el ProperyMemberRole para saber el rol de dicho
    //recuperamos el id del role LANDORD

    const propertyActorRole =
      await this.propertyRepository.findPropertyActorRoleByName('LANDLORD');

    if (!propertyActorRole) {
      throw new PropertyActorRoleNotFoundException();
    }

    //guardamos la informacion del usuario con rol en propertyMemberRole
    const propertyMemberRole: PropertyMemberRoleType = {
      propertyMemberId,
      propertyActorRoleId: propertyActorRole.id,
    };

    await this.propertyRepository.savePropertyMemberRole(propertyMemberRole);

    return { id: propertyId, message: 'propiedad registrada exitosamente!' };
  }

  async consultAllProperties(
    userId: string,
    paginationDto: PaginationType,
  ): Promise<PaginationResponse<PropertyInfoResponse>> {
    return await this.propertyRepository.findAll(userId, paginationDto);
  }

  async consultPropertyById(userId: string, id: string) {
    const data = await this.propertyRepository.findPropertyById(userId, id);

    if (!data) {
      throw new PropertyNotFoundException();
    }

    return data;
  }

  async editingProperty(
    userId: string,
    partialProperty: EditingPropertyType,
  ): Promise<{ id: string; message: string }> {
    //verificamos que exista dicha propiedad
    const property = await this.propertyRepository.findPropertyById(
      userId,
      partialProperty.id,
    );

    if (!property) {
      throw new PropertyNotFoundException();
    }

    //limpiamos los datos
    const cleanProperty = this.helper.cleanUndefined(partialProperty);

    const data: Prisma.PropertyUpdateInput = {};

    //edicion de parametros por keys
    for (const [key, value] of Object.entries(cleanProperty)) {
      switch (key) {
        case 'propertyType': {
          const propertyName =
            await this.propertyRepository.findTypePropertyByName(
              value as TypePropertyType,
            );

          if (!propertyName) {
            break;
          }

          const { id } = propertyName;

          data.typeProperty = {
            connect: {
              id,
            },
          };
          break;
        }

        case 'propertyOccupationType': {
          const propertyOccupation =
            await this.propertyRepository.findPropertyOccupationTypeByName(
              value as PropertyOccupationType,
            );

          if (!propertyOccupation) {
            break;
          }

          const { id } = propertyOccupation;

          data.propertyOccupationType = {
            connect: {
              id,
            },
          };
          break;
        }

        case 'resourcesImages': {
          const currentImages =
            await this.propertyRepository.findAssetsResourcesByPropertyId(
              property.id,
            );

          const incomingImages = value as createResourceImageType[];

          const current = new Set(currentImages.map((i) => i.assetId));
          const incoming = new Set(incomingImages.map((i) => i.assetId));

          const toDelete = currentImages
            .filter((image) => !incoming.has(image.assetId!))
            .map((image) => image.assetId!);

          const toInsert: Prisma.ResourceImagesCreateManyInput[] =
            incomingImages
              .filter((image) => !current.has(image.assetId!))
              .map((image) => ({
                assetId: image.assetId,
                width: image.width,
                height: image.height,
                format: image.format,
                url: image.url,
                secureUrl: image.secureUrl,
                propertyId: property.id,
              }));

          await this.propertyRepository.updateResourcesImages(
            toDelete,
            toInsert,
          );

          break;
        }

        default:
          data[key] = value;
      }
    }

    const result = await this.propertyRepository.updateProperty(
      partialProperty.id,
      userId,
      data,
    );

    return { id: result.id, message: 'propiedad actualizada exitosamente!' };
  }

  //cambiar el propietario de la vivienda
  async changeOwnerProperty(oldOwner: string, newOwner: string) {}
}
