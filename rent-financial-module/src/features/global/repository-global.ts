import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service.js';
import type {
  DirectionType,
  ResourceImageType,
} from '../property-registration/schemas/property-registration.schema.js';

/*
 *Repositorio global para utilizacion entre las distintas features sin repetir codigo
 */
@Injectable()
export class GlobalRepository {
  constructor(private readonly prisma: PrismaService) {}

  async saveDirection(direction: DirectionType) {
    return await this.prisma.direction.create({ data: direction });
  }
  async saveAssetResource(resourceimage: ResourceImageType) {
    return await this.prisma.resourceImages.create({ data: resourceimage });
  }
}
