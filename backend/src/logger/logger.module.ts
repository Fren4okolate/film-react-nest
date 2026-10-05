import { LoggerService, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DevLogger } from './dev.logger';
import { JsonLogger } from './json.logger';
import { TSKVLogger } from './tskv.logger';

export const APP_LOGGER = Symbol('APP_LOGGER');

export function selectLogger(
  config: ConfigService,
  dev: DevLogger,
  json: JsonLogger,
  tskv: TSKVLogger,
): LoggerService {
  const defaultFormat =
    config.get<string>('NODE_ENV') === 'production' ? 'json' : 'dev';
  const format = config.get<string>('LOGGER_FORMAT', defaultFormat);
  switch (format) {
    case 'dev':
      return dev;
    case 'json':
      return json;
    case 'tskv':
      return tskv;
    default:
      throw new Error('LOGGER_FORMAT must be dev, json or tskv');
  }
}

@Module({
  imports: [ConfigModule],
  providers: [
    DevLogger,
    JsonLogger,
    TSKVLogger,
    {
      provide: APP_LOGGER,
      inject: [ConfigService, DevLogger, JsonLogger, TSKVLogger],
      useFactory: selectLogger,
    },
  ],
  exports: [APP_LOGGER],
})
export class LoggerModule {}
