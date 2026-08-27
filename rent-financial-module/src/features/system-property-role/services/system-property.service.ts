import { Injectable } from '@nestjs/common';
import { SystemPropertyRoleRepository } from '../repository/sytem-property-role.repository.js';
import {
  NotAllowedStatusByPropertyMemberException,
  PoliciesAuthorizationNotAllowed,
  PoliciesNotFoundException,
  PropertyMemberNotFound,
} from '../exceptions/exceptions.js';
import { PrismaService } from '../../../core/database/prisma.service.js';

//¿Que necesitamos para poder evaluar correctamente los roles?

/**
 * 1. Recibir el userId de la persona a la cual se le va a cargar las politicas
 * 2. Recibir las politicas permitidos
 * 3. añadir logica para ver si cumple con la politica permitida en el metodo o de lo contrario enviar una excepcion
 */

export function cleanPolicies(policies: string[], override: string[]) {
  const removeDuplicatesPolicies = [...new Set(policies)];

  //aca limpiamos las politicas donde obtenemos todas las politicas referente
  // a un rol y despues obtenemos aquellas politicas que tiene desactivado por parte del propietario
  // referente a su rol, para dejar las que verdaderamente tiene para ese inmueble
  return removeDuplicatesPolicies.filter(
    (policy) => !override.includes(policy),
  );
}

//retorna true si las politicas y overrides cumplen con las politicas permitidos
// si es false se lanzara una excepcion ya que el proceso no es permitido
function IsAllowedByPolicies(
  policies: string[],
  override: string[],
  allowedPolicies: string[],
): boolean {
  const realPolicies = cleanPolicies(policies, override);

  //verificamos que de las politicas verdaderass que tenga el mimebro coincidan con aquellas politicas
  //permitidas a nivel de logica de negocio
  const actionAllowed = realPolicies.some((policy) =>
    allowedPolicies.includes(policy),
  );

  //si tiene permitido la accion gracias a sus politicas retornamos true caso contrario false
  if (actionAllowed) {
    return true;
  }

  return false;
}

@Injectable()
export class SystemPropertyService {
  constructor(
    private systemRepository: SystemPropertyRoleRepository,
    private prisma: PrismaService,
  ) {}

  async CheckPolicies(propertyMemberId: string, allowedPolicies: string[]) {
    //antes de encontrar sus respectivas politicas debemos verificar que
    //dicho property member este en un estado active y puede realizar acciones
    // en la app
    await this.VerifyPropertyMemberIsActive(propertyMemberId);

    //encontramos todos las politicas para todos los roles de este usuario
    const policies =
      await this.systemRepository.findAllPoliciesByPropertyMemberId(
        propertyMemberId,
      );

    //sino encontramos politicas para este miembro lanzamos la excepcion
    if (!policies) {
      throw new PoliciesNotFoundException();
    }

    //encontramos si es el caso politicas que han sido restringidos por roles superiores
    const override =
      await this.systemRepository.findOverridePolicyByPropertyMemberId(
        propertyMemberId,
      );

    if (!IsAllowedByPolicies(policies, override, allowedPolicies)) {
      throw new PoliciesAuthorizationNotAllowed();
    }
  }

  //metodo para saber si el usuario se encuentra activo para dicha propiedad
  async VerifyPropertyMemberIsActive(propertyMemberId: string) {
    const member = await this.prisma.propertyMember.findFirst({
      where: {
        id: propertyMemberId,
      },
    });

    if (!member) {
      throw new PropertyMemberNotFound(propertyMemberId);
    }

    if (member.status != 'ACTIVE') {
      throw new NotAllowedStatusByPropertyMemberException();
    }
  }
}
