import { Module } from '@nestjs/common';
import { ContractController } from './contract.controller.js';
import { ContractService } from './services/contract.service.js';
import { ContractRepository } from './repository/contract.repository.js';
import { PrismaModule } from '../../core/database/prisma.module.js';
import { PropertyRegistrationModule } from '../property-registration/property-registration.module.js';
import { GlobalModule } from '../global/global.module.js';
import { SytemPropertyRoleModule } from '../system-property-role/system-property-role.module.js';

@Module({
  controllers: [ContractController],
  providers: [ContractService, ContractRepository],
  imports: [
    PrismaModule,
    PropertyRegistrationModule,
    GlobalModule,
    SytemPropertyRoleModule,
  ],
})
export class ContractModule {}
