import { Module } from '@nestjs/common';
import { JwtPassport } from './core/auth/auth-strategy.js';
import { JwtAuthGuard } from './core/auth/auth.guard.js';
import { PropertyRegistrationModule } from './features/property-registration/property-registration.module.js';
import { PrismaModule } from './core/database/prisma.module.js';
import { ContractModule } from './features/contract/contract.module.js';
import { GlobalModule } from './features/global/global.module.js';

@Module({
  imports: [
    PropertyRegistrationModule,
    PrismaModule,
    ContractModule,
    GlobalModule,
  ],
  providers: [JwtPassport, JwtAuthGuard],
})
export class AppModule {}
