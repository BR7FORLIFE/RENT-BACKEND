import {
  Injectable,
  type OnModuleDestroy,
  type OnModuleInit,
} from '@nestjs/common';

import { PrismaClient } from '../../../generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { POSTGRES_URI } from '../../config/env.js';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    const adapter = new PrismaPg({
      connectionString: POSTGRES_URI!,
    });

    super({ adapter });
  }

  async onModuleDestroy() {
    await super.$disconnect();
  }

  async onModuleInit() {
    await super.$connect();
  }
}
