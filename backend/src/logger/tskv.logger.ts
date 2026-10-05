import { Injectable, LogLevel } from '@nestjs/common';
import { serialize } from './serialize';
import { StructuredLogger } from './structured.logger';

function escapeValue(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\t/g, '\\t')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\0/g, '\\0')
    .replace(/=/g, '\\=');
}

@Injectable()
export class TSKVLogger extends StructuredLogger {
  formatMessage(
    level: LogLevel,
    message: unknown,
    ...optionalParams: unknown[]
  ): string {
    const messageValue =
      typeof message === 'string' ? message : serialize(message);
    return [
      'tskv',
      `level=${escapeValue(level)}`,
      `message=${escapeValue(messageValue)}`,
      `optionalParams=${escapeValue(serialize(optionalParams))}`,
    ].join('\t');
  }
}
