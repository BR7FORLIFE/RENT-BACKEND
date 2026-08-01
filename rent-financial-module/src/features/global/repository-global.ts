import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service.js';
import type {
  createInvitationPropertyMemberType,
  DirectionType,
  ResourceImageType,
} from '../property-registration/schemas/property-registration.schema.js';
import type { Prisma } from '../../../generated/prisma/client.js';

/*
 *Repositorio global para utilizacion entre las distintas features sin repetir codigo
 */
@Injectable()
export class GlobalRepository {
  constructor(private readonly prisma: PrismaService) {}

  //saves
  async saveDirection(
    direction: DirectionType,
    db: Prisma.TransactionClient = this.prisma,
  ) {
    return await db.direction.create({ data: direction });
  }
  async saveAssetResource(
    resourceimage: ResourceImageType,
    db: Prisma.TransactionClient = this.prisma,
  ) {
    return await db.resourceImages.create({ data: resourceimage });
  }

  async saveInvitationLinked(
    data: createInvitationPropertyMemberType,
    db: Prisma.TransactionClient = this.prisma,
  ) {
    return await db.invitationLinked.create({ data });
  }

  //finds
  async findPropertyInvitationByToken(
    token: string,
    db: Prisma.TransactionClient = this.prisma,
  ) {
    return await db.invitationLinked.findFirst({
      where: {
        token,
      },
    });
  }
}
