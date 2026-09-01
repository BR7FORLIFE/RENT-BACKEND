import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service.js';
import type {
  createInvitationPropertyMemberType,
  DirectionType,
} from '../property-registration/schemas/property-registration.schema.js';
import type { Prisma } from '../../../generated/prisma/client.js';
import type { NotificationType, ResourceImageType } from './global.schema.js';

/*
 *Repositorio global para utilizacion entre las distintas features sin repetir codigo
 */
@Injectable()
export class GlobalRepository {
  constructor(private readonly prisma: PrismaService) {}

  //saves

  //directions
  async saveDirection(
    direction: DirectionType,
    db: Prisma.TransactionClient = this.prisma,
  ) {
    return await db.direction.create({ data: direction });
  }

  //resources
  async saveAssetResource(
    resourceimage: ResourceImageType,
    db: Prisma.TransactionClient = this.prisma,
  ) {
    return await db.resourceImages.create({ data: resourceimage });
  }

  //invitations
  async saveInvitationLinked(
    data: createInvitationPropertyMemberType,
    db: Prisma.TransactionClient = this.prisma,
  ) {
    return await db.invitationLinked.create({ data });
  }

  //notifications
  async saveNotification(
    data: NotificationType,
    db: Prisma.TransactionClient = this.prisma,
  ) {
    return await db.notifications.create({
      data,
    });
  }

  //finds

  //property invitations
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

  //notifications
  async findAllNotifications() {}
}
