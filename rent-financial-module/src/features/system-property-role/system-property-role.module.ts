import { Module } from '@nestjs/common';
import { SystemPropertyRoleRepository } from './repository/sytem-property-role.repository.js';
import { SystemPropertyService } from './services/system-property.service.js';
import { PrismaModule } from '../../core/database/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [],
  providers: [SystemPropertyRoleRepository, SystemPropertyService],
  exports: [SystemPropertyRoleRepository, SystemPropertyService],
})
export class SytemPropertyRoleModule {}
