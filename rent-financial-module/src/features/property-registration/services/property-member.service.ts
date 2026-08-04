import { Injectable } from '@nestjs/common';
import { PropertyMemberRepository } from '../repository/property-member.repository.js';
import type { PropertyMemberStatus } from '../schemas/property-registration.schema.js';
import { PropertyRepository } from '../repository/property.repository.js';
import { PropertyNotFoundException } from '../exceptions/exceptions.js';
import type {
  PaginationResponse,
  PaginationType,
} from '../../../shared/pagination/pagination-schemas.js';
import { PrismaService } from '../../../core/database/prisma.service.js';
import { getAllUsers } from '../api.js';
import { unionInfoUser } from './helpers.service.js';

/**
 * De que se encargara este servicio?
 *
 * - Consultar todos los miembros activos de una propiedad gracias a su ID o filtrar por otro estado
 * - Consultar un miembro en especifico por su ID
 * - Cambiar el estado de actividad (ACTIVE, DESACTIVE, IN_PROCESS) de un miembro
 * - asignar un role al miembro activo y sus permisos para hacer cosas en la propiedad
 * - Historial de cambios para los property Members donde se auditara los cambios de estados, roles, etc.
 */

export interface GetAllUserData {
  userId: string;
  status?: PropertyMemberStatus | undefined;
  assignedAt?: Date | undefined;
  username: string;
  email: string;
  cellphone: string;
  fullname: string;
}

@Injectable()
export class PropertyMemberService {
  constructor(
    private readonly prismaClient: PrismaService,

    private propertyMemberRepository: PropertyMemberRepository,
    private propertyRepository: PropertyRepository,
  ) {}

  /**
   * A tener en cuenta
   *
   * pretendemos enviar el siguiente modelo:
   *
   * (AUTH-RENT) -> microservicio de autenticacion
   * username, email, cellphone, fullname, identificationType, identification number
   *
   * (FINANCIAL -RENT) -> microservicio de propiedades
   * status, assignedAt
   */
  async getAllPropertyMemberByPropertyId(
    ownerUserPropertyId: string,
    propertyId: string,
    status: PropertyMemberStatus,
    paginationDto: PaginationType,
  ): Promise<PaginationResponse<GetAllUserData>> {
    //verificamos que dicho inmueble sea de dicho propitario
    const optOwnerProperty = await this.propertyRepository.findPropertyById(
      ownerUserPropertyId,
      propertyId,
    );

    if (!optOwnerProperty) {
      throw new PropertyNotFoundException();
    }

    //obtenemos la informacion parcial para despues unirla al del servidor
    const result = await this.prismaClient.$transaction(async (tx) => {
      const { data, metadata } = await this.propertyMemberRepository.findAll(
        tx,
        propertyId,
        status,
        paginationDto,
      );

      return { data, metadata };
    });

    //obtenemos la informacion completa dentro del otro microservicio
    // de autenticacion
    const userData = await getAllUsers(result.data.map((user) => user.userId));

    const unionInfo = unionInfoUser(result.data, userData);

    return { data: unionInfo, metadata: result.metadata };
  }
}
