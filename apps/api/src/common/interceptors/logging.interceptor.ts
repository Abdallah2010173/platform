import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';

/**
 * Logs incoming requests (method, URL, status code, duration) at the
 * DEBUG/LOG level. Production-safe — no request bodies are logged.
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const { method, originalUrl } = request;
    const start = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const response = ctx.getResponse();
          const status = response.statusCode;
          const duration = Date.now() - start;
          this.logger.log(`${method} ${originalUrl} ${status} ${duration}ms`);
        },
        error: (err: { status?: number; message?: string }) => {
          const status = err?.status ?? 500;
          const duration = Date.now() - start;
          this.logger.warn(`${method} ${originalUrl} ${status} ${duration}ms - ${err?.message}`);
        },
      }),
    );
  }
}
