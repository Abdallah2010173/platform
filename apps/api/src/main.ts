import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger, BadRequestException } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { ParsePaginationPipe } from './presentation/common/pipes/parse-pagination.pipe';
import express from 'express';
import { join } from 'node:path';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 4000);
  const apiPrefix = configService.get<string>('API_PREFIX', 'api/v1');

  const frontendUrl = configService.get<string>('FRONTEND_URL', '')?.replace(/\/+$/, '');
  const corsOrigin = configService.get<string>('CORS_ORIGIN', '');

  const origins = new Set<string>();
  const addOriginVariants = (value: string) => {
    const normalized = value.replace(/\/+$/, '');
    origins.add(normalized);
    try {
      const parsed = new URL(normalized);
      const host = parsed.hostname.startsWith('www.') ? parsed.hostname.slice(4) : `www.${parsed.hostname}`;
      origins.add(`${parsed.protocol}//${host}${parsed.port ? `:${parsed.port}` : ''}`);
    } catch {
      // Ignore malformed optional origin values; validation remains handled by CORS.
    }
  };

  if (frontendUrl) addOriginVariants(frontendUrl);
  if (corsOrigin) {
    for (const o of corsOrigin.split(',')) {
      const trimmed = o.trim();
      if (trimmed && trimmed !== '*') addOriginVariants(trimmed);
    }
  }

  // تبسيط الاستثناء لمنع تضارب الـ Regex المسبب للـ Crash
  app.setGlobalPrefix(apiPrefix);

  app.use(helmet());
  app.use(cookieParser());
  app.use('/uploads', express.static(join(process.cwd(), 'uploads')));

  app.enableCors({
    origin: (requestOrigin, callback) => {
      if (!requestOrigin || origins.size === 0 || origins.has(requestOrigin)) {
        callback(null, true);
      } else {
        callback(new Error('Origin is not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.useGlobalPipes(
    new ParsePaginationPipe(),
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      exceptionFactory: (errors) => {
        const messages = errors.map((e) => {
          const constraints = e.constraints ? Object.values(e.constraints) : [];
          return `${e.property}: ${constraints.join(', ')}`;
        });
        return new BadRequestException(messages.join('; '));
      },
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());
  app.useGlobalInterceptors(new TransformInterceptor());

const swaggerConfig = new DocumentBuilder()
    .setTitle('Global Math API')
    .setDescription('Enterprise Learning Management System API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);

  // استدعاء واحد فقط ونظيف
  SwaggerModule.setup('api/v1/docs', app, document);

  await app.listen(port, '0.0.0.0');
  logger.log(`API running on http://localhost:${port}/${apiPrefix}`);
  logger.log(`Swagger docs at http://localhost:${port}/${apiPrefix}/docs`);

  const keepAliveUrl = configService.get<string>('KEEP_ALIVE_URL')?.trim();
  if (keepAliveUrl) {
    const intervalMs = configService.get<number>('KEEP_ALIVE_INTERVAL_MS', 10 * 60 * 1000);
    const ping = async () => {
      try {
        const response = await fetch(keepAliveUrl, { signal: AbortSignal.timeout(10_000) });
        if (!response.ok) logger.warn(`Keep-alive request failed with status ${response.status}`);
      } catch (error) {
        logger.warn(`Keep-alive request failed: ${error instanceof Error ? error.message : 'unknown error'}`);
      }
    };

    void ping();
    setInterval(() => void ping(), intervalMs);
    logger.log(`Keep-alive enabled every ${Math.round(intervalMs / 1000)} seconds`);
  }
}

void bootstrap();