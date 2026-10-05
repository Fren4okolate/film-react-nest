import { Injectable, LogLevel } from '@nestjs/common';
import { serialize } from './serialize';
import { StructuredLogger } from './structured.logger';

@Injectable()
export class JsonLogger extends StructuredLogger {
  formatMessage(
    level: LogLevel,
    message: unknown,
    ...optionalParams: unknown[]
  ): string {
    return serialize({ level, message: message ?? null, optionalParams });
  }
}
