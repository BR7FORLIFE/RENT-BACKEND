import { Module } from '@nestjs/common';
import { PrismaModule } from '../../core/database/prisma.module.js';
import { SytemPropertyRoleModule } from '../system-property-role/system-property-role.module.js';
import { FinanceController } from './finance.controller.js';
import { FinanceService } from './services/finance.service.js';
import { FinanceAutomationService } from './services/finance-automation.service.js';
import { ModelClient } from './services/model-client.service.js';
import { FinanceRepository } from './repository/finance.repository.js';

@Module({
  controllers: [FinanceController],
  providers: [
    FinanceService,
    FinanceRepository,
    FinanceAutomationService,
    ModelClient,
  ],
  exports: [FinanceAutomationService],
  imports: [PrismaModule, SytemPropertyRoleModule],
})
export class FinanceModule {}
