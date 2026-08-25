import { Module } from '@nestjs/common';
import { SystemPropertyRoleRepository } from './repository/sytem-property-role.repository.js';
import { PrismaModule } from '../../core/database/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [],
  providers: [SystemPropertyRoleRepository],
  exports: [SystemPropertyRoleRepository],
})
export class SytemPropertyRoleModule {}
