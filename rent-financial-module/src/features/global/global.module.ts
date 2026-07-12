import { Module } from '@nestjs/common';
import { GlobalRepository } from './repository-global.js';
import { PrismaModule } from '../../core/database/prisma.module.js';

@Module({
  imports: [PrismaModule],
  providers: [GlobalRepository],
  exports: [GlobalRepository],
})
export class GlobalModule {}
