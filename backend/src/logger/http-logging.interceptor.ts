import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable, tap } from 'rxjs';

@Injectable()
export class HttpLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const started = Date.now();
    const entry = (statusCode: number) => ({
      method: request.method,
      path: request.path,
      statusCode,
      durationMs: Date.now() - started,
    });

    return next.handle().pipe(
      tap({
        next: () => this.logger.log(entry(response.statusCode)),
        error: (error: unknown) =>
          this.logger.error(
            entry(error instanceof HttpException ? error.getStatus() : 500),
          ),
      }),
    );
  }
}
