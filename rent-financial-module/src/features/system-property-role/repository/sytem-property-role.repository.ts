import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service.js';
import type { Prisma } from '../../../../generated/prisma/client.js';

//el objetivo de este repositorio es facilitar el proceso de busqueda de roles y politicas
//referentes a cada usuario

@Injectable()
export class SystemPropertyRoleRepository {
  constructor(private prisma: PrismaService) {}

  async findActorRolesByPropertyMemberId(
    propertyMemberId: string,
    db: Prisma.TransactionClient = this.prisma,
  ) {
    const relations = await db.propertyMemberRole.findMany({
      where: {
        propertyMemberId,
      },
      select: {
        propertyActorRole: true,
      },
    });

    return relations.map((relation) => relation.propertyActorRole.name);
  }

  //esto permite encontrar todas las politicas basado en un rol
  async findPoliciesByActorRoleId(
    propertyActorRoleId: string,
    db: Prisma.TransactionClient = this.prisma,
  ) {
    const relations = await db.propertyActorRolePolicyStatements.findMany({
      where: {
        propertyActorRoleId,
      },
      select: {
        policyStatement: true,
      },
    });

    return relations.map((relation) => relation.policyStatement.policyName);
  }

  //este metodo permite obtener los overrides o aquellas politicas donde
  // los miembros de la propiedad lo tengan desactivados
  async findOverridePolicyByPropertyMemberId(
    propertyMemberId: string,
    db: Prisma.TransactionClient = this.prisma,
  ) {
    const relations = await db.propertyMemberPoliciesOverride.findMany({
      where: {
        propertyMemberId,
        active: false,
      },
      select: {
        policyStatement: true,
      },
    });

    return relations.map((relation) => relation.policyStatement.policyName);
  }

  //obtener todas las politicas para cada rol por la id del miembro de la propiedad
  async findAllPoliciesByPropertyMemberId(
    propertyMemberId: string,
    db: Prisma.TransactionClient = this.prisma,
  ) {
    const member = await db.propertyMember.findUnique({
      where: {
        id: propertyMemberId,
      },
      include: {
        propertyMemberRole: {
          include: {
            propertyActorRole: {
              include: {
                propertyActorRolePolicyStatements: {
                  include: {
                    policyStatement: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return member?.propertyMemberRole.flatMap((memberRole) =>
      memberRole.propertyActorRole.propertyActorRolePolicyStatements.map(
        (roleStatement) => roleStatement.policyStatement.policyName,
      ),
    );
  }

  //updates

  //este metodo permitirá sobrescribir el rol del usuario hacia otro
  async updatePropertyActorRole(
    propertyMemberId: string,
    oldActorRoleId: string,
    newActorRoleId: string,
    db: Prisma.TransactionClient = this.prisma,
  ) {
    return await db.propertyMemberRole.update({
      where: {
        propertyActorRoleId_propertyMemberId: {
          propertyMemberId: propertyMemberId,
          propertyActorRoleId: oldActorRoleId,
        },
      },
      data: {
        propertyActorRoleId: newActorRoleId,
      },
    });
  }
}
