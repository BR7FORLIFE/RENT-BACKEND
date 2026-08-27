import { Injectable } from '@nestjs/common';
import { SystemPropertyRoleRepository } from '../repository/sytem-property-role.repository.js';
import {
  PoliciesAuthorizationNotAllowed,
  PoliciesNotFoundException,
} from '../exceptions/exceptions.js';

//¿Que necesitamos para poder evaluar correctamente los roles?

/**
 * 1. Recibir el userId de la persona a la cual se le va a cargar las politicas
 * 2. Recibir las politicas permitidos
 * 3. añadir logica para ver si cumple con la politica permitida en el metodo o de lo contrario enviar una excepcion
 */

//retorna true si las politicas y overrides cumplen con las politicas permitidos
// si es false se lanzara una excepcion ya que el proceso no es permitido
function findPolicyByPolicies(
  policies: string[],
  override: string[],
  allowedPolicies: string[],
): boolean {
  return false;
}

@Injectable()
export class SystemPropertyService {
  constructor(private systemRepository: SystemPropertyRoleRepository) {}

  async CheckPolicies(propertyMemberId: string, allowedPolicies: string[]) {
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

    if (!findPolicyByPolicies(policies, override, allowedPolicies)) {
      throw new PoliciesAuthorizationNotAllowed();
    }
  }
}
