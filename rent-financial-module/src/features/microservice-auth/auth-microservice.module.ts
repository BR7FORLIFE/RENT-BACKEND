import { Module } from '@nestjs/common';
import { MicroserviceAuthService } from './auth-microservice.service.js';

@Module({
  providers: [MicroserviceAuthService],
  exports: [MicroserviceAuthService],
})
export class MicroserviceAuthModule {}
