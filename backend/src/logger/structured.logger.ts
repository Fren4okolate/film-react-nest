import { LoggerService, LogLevel } from '@nestjs/common';

export abstract class StructuredLogger implements LoggerService {
  abstract formatMessage(
    level: LogLevel,
    message: unknown,
    ...optionalParams: unknown[]
  ): string;

  log(message: unknown, ...optionalParams: unknown[]): void {
    console.log(this.formatMessage('log', message, ...optionalParams));
  }

  error(message: unknown, ...optionalParams: unknown[]): void {
    console.error(this.formatMessage('error', message, ...optionalParams));
  }

  warn(message: unknown, ...optionalParams: unknown[]): void {
    console.warn(this.formatMessage('warn', message, ...optionalParams));
  }

  debug(message: unknown, ...optionalParams: unknown[]): void {
    console.debug(this.formatMessage('debug', message, ...optionalParams));
  }

  verbose(message: unknown, ...optionalParams: unknown[]): void {
    console.log(this.formatMessage('verbose', message, ...optionalParams));
  }

  fatal(message: unknown, ...optionalParams: unknown[]): void {
    console.error(this.formatMessage('fatal', message, ...optionalParams));
  }
}
