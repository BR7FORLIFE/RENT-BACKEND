import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { GlobalExceptionFilter } from './core/filters/exception.filter.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalFilters(new GlobalExceptionFilter());

  app.setGlobalPrefix('rent-financial');

  await app.listen(process.env.PORT ?? 3002);
}
bootstrap();
