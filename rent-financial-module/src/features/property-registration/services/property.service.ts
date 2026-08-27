import { Injectable } from '@nestjs/common';
import type {
  PropertyMemberRoleType,
  PropertyMemberType,
  PropertyType,
} from '../schemas/property-registration.schema.js';
import { PropertyRepository } from '../repository/property.repository.js';
import {
  PropertyAlreadyRegisterException,
  PropertyNotFoundException,
  PropertyOccupationTypeNotFoundException,
  TypePropertyNotFoundException,
} from '../exceptions/exceptions.js';
import type {
  PaginationResponse,
  PaginationType,
} from '../../../shared/pagination/pagination-schemas.js';
import { PropertyHelper } from './helpers.service.js';
import type {
  CreatePropertyType,
  createResourceImageType,
  EditingPropertyType,
} from '../dtos/request-dto.js';
import type { Prisma } from '../../../../generated/prisma/client.js';
import type { PropertyOccupationType, TypePropertyType } from '../types.js';
import { GlobalRepository } from '../../global/repository-global.js';
import {
  TYPE_LANDORD_ACTOR_ROLES_UUIDS,
  TYPE_PROPERTY_OCCUPATION_TYPE_UUIDS,
  TYPE_PROPERTY_UUIDS,
  POLICIES_STATEMENTS_NAMES,
} from '../../../types/global-types.js';
import { PrismaService } from '../../../core/database/prisma.service.js';
import { PropertyMemberRepository } from '../repository/property-member.repository.js';
import type { Property } from '../dtos/response-dto.js';
import { PropertyServiceMapper } from '../repository/mappers/property-mapper.service.js';
import { PropertyMemberNotFound } from '../../system-property-role/exceptions/exceptions.js';
import { SystemPropertyService } from '../../system-property-role/services/system-property.service.js';

@Injectable()
export class PropertyService {
  constructor(
    private readonly prismaClient: PrismaService,
    private readonly helper: PropertyHelper,
    private readonly propertyRepository: PropertyRepository,
    private readonly propertyMemberRepository: PropertyMemberRepository,
    private readonly propertyMapper: PropertyServiceMapper,
    private readonly systemRole: SystemPropertyService,
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

    //Asignamos las respectivas id de las tablas logicas segun el dto que se recibe
    const occupationTypeId =
      TYPE_PROPERTY_OCCUPATION_TYPE_UUIDS[propertyDto.propertyOccupationType];

    if (!occupationTypeId) {
      throw new PropertyOccupationTypeNotFoundException();
    }

    const typePropertyId = TYPE_PROPERTY_UUIDS[propertyDto.propertyType];

    if (!typePropertyId) {
      throw new TypePropertyNotFoundException();
    }

    //creamos la transaccion atomica de los principios ACID para guardar de forma segura el inmueble
    const result = await this.prismaClient.$transaction(async (tx) => {
      //registramos el inmueble y guardamos los recursos correspondientes a la vivienda
      const newProperty: PropertyType = {
        userId,
        fmi: propertyDto.fmi,
        isPublished: false,
        predialNumber: propertyDto.predialNumber,
        propertyOccupationTypeId: occupationTypeId,
        propertyTypeId: typePropertyId,
        registerByUserId: userId,
        propertyDescription: propertyDto.propertyDescription,
        propertyName: propertyDto.propertyName,
      };

      //guardar la correspondiente propiedad
      const { id: propertyId } = await this.propertyRepository.saveProperty(
        newProperty,
        propertyDto.resourcesImages,
        propertyDto.economicPropertyInfo,
        propertyDto.structurePropertyInfo,
        tx,
      );

      //creamos la direccion del inmueble
      const direction = { ...propertyDto.direction, propertyId };
      await this.globalRepository.saveDirection(direction, tx);

      //creamos el MemberRole ya que el usuario que digita un inmueble
      // posee un ROL de Arrendador o muchos mas
      const propertyMember: PropertyMemberType = {
        userId,
        assignedBy: userId,
        propertyId,
        status: 'ACTIVE',
      };

      const { id: propertyMemberId } =
        await this.propertyMemberRepository.savePropertyMember(
          propertyMember,
          tx,
        );

      //guardamos la informacion del usuario con rol en propertyMemberRole
      const propertyMemberRole: PropertyMemberRoleType = {
        propertyMemberId,
        propertyActorRoleId: TYPE_LANDORD_ACTOR_ROLES_UUIDS.PROPIETARIO,
      };

      await this.propertyMemberRepository.savePropertyMemberRole(
        propertyMemberRole,
        tx,
      );

      return {
        propertyId,
      };
    });

    return {
      id: result.propertyId,
      message: 'propiedad registrada exitosamente!',
    };
  }

  async consultAllProperties(
    userId: string,
    paginationDto: PaginationType,
  ): Promise<PaginationResponse<Property>> {
    const { data, metadata } = await this.propertyRepository.findAll(
      userId,
      paginationDto,
    );
    const res = data.map((p) => this.propertyMapper.toDomain(p));

    return { data: res, metadata };
  }

  async consultPropertyById(userId: string, id: string): Promise<Property> {
    const data = await this.propertyRepository.findPropertyById(userId, id);

    if (!data) {
      throw new PropertyNotFoundException();
    }

    return this.propertyMapper.toDomain(data);
  }

  async editingProperty(
    userId: string,
    propertyId: string,
    partialProperty: EditingPropertyType,
  ): Promise<{ id: string; message: string }> {
    //verificamos que exista dicha propiedad
    const property = await this.propertyRepository.findPropertyById(
      userId,
      propertyId,
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
          const propertyId = TYPE_PROPERTY_UUIDS[value as TypePropertyType];

          if (!propertyId) {
            break;
          }

          data.typeProperty = {
            connect: {
              id: propertyId,
            },
          };
          break;
        }

        case 'propertyOccupationType': {
          const propertyOccupationId =
            TYPE_PROPERTY_OCCUPATION_TYPE_UUIDS[
              value as PropertyOccupationType
            ];

          if (!propertyOccupationId) {
            break;
          }

          data.propertyOccupationType = {
            connect: {
              id: propertyOccupationId,
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

          const current = new Set(
            currentImages.map((i) => i.resourcesImage.assetId),
          );
          const incoming = new Set(incomingImages.map((i) => i.assetId));

          const toDelete = currentImages
            .filter(
              (resource) => !incoming.has(resource.resourcesImage.assetId!),
            )
            .map((resource) => resource.resourcesImage.assetId!);

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
      propertyId,
      userId,
      data,
    );

    return { id: result.id, message: 'propiedad actualizada exitosamente!' };
  }

  //cambiar el propietario de la vivienda
  //async changeOwnerProperty(oldOwner: string, newOwner: string) {}

  //ver todos los documentos de la propiedad
  async getAllDocuments(
    propertyId: string,
    userId: string,
    paginationDto: PaginationType,
  ) {
    //primero buscamos el property member asociado al userId
    const optPropertyMember =
      await this.propertyMemberRepository.findPropertyMemberByUserIdAndPropertyId(
        userId,
        propertyId,
      );

    if (!optPropertyMember) {
      throw new PropertyMemberNotFound(userId);
    }

    //para permitir leer documentos del inmueble debe cumplir con una politica en especifico
    //VER_DOCUMENTOS_INMUEBLE
    await this.systemRole.CheckPolicies(optPropertyMember.id, [
      POLICIES_STATEMENTS_NAMES.VER_DOCUMENTOS_INMUEBLE,
    ]);

    return this.propertyRepository.findAllAssetsResourcesByPropertyId(
      propertyId,
      paginationDto,
    );
  }
}
