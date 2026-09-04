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

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 4000);
  const apiPrefix = configService.get<string>('API_PREFIX', 'api/v1');

  const frontendUrl = configService.get<string>('FRONTEND_URL', '')?.replace(/\/+$/, '');
  const corsOrigin = configService.get<string>('CORS_ORIGIN', '');

  const origins = new Set<string>();
  if (frontendUrl) origins.add(frontendUrl);
  if (corsOrigin) {
    for (const o of corsOrigin.split(',')) {
      const trimmed = o.trim();
      if (trimmed) origins.add(trimmed.replace(/\/+$/, ''));
    }
  }

  // تبسيط الاستثناء لمنع تضارب الـ Regex المسبب للـ Crash
  app.setGlobalPrefix(apiPrefix, {
    exclude: ['health'],
  });

  app.use(helmet());
  app.use(cookieParser());

  app.enableCors({
    origin: origins.size > 0 ? [...origins] : false,
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
    .setTitle('Platform LMS API')
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
}

void bootstrap();