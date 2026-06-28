import { Module } from '@nestjs/common';
import { JwtPassport } from './core/auth/auth-strategy.js';
import { JwtAuthGuard } from './core/auth/auth.guard.js';
import { PropertyRegistrationModule } from './features/property-registration/property-registration.module.js';
import { PrismaModule } from './core/database/prisma.module.js';

@Module({
  imports: [PropertyRegistrationModule, PrismaModule],
  controllers: [],
  providers: [JwtPassport, JwtAuthGuard],
})
export class AppModule {}
