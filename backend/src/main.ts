import { NestFactory } from '@nestjs/core';
import { LoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { APP_LOGGER } from './logger/logger.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const config = app.get(ConfigService);
  app.useLogger(app.get<LoggerService>(APP_LOGGER));
  app.setGlobalPrefix('api/afisha');
  app.enableCors();
  app.enableShutdownHooks();
  await app.listen(Number(config.get<string>('PORT', '3000')), '0.0.0.0');
}
bootstrap();
