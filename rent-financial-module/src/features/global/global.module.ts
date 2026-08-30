import { Module } from '@nestjs/common';
import { GlobalRepository } from './repository-global.js';
import { PrismaModule } from '../../core/database/prisma.module.js';
import { GlobalService } from './global.service.js';

@Module({
  imports: [PrismaModule],
  providers: [GlobalRepository, GlobalService],
  exports: [GlobalRepository, GlobalService],
})
export class GlobalModule {}
