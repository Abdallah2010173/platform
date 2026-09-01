import { IsEnum, IsNumber, IsOptional, IsString, Min, Max } from 'class-validator';
import { plainToInstance, Type } from 'class-transformer';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

export class EnvironmentVariables {
  @IsEnum(Environment)
  NODE_ENV: Environment = Environment.Development;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(65535)
  PORT: number = 4000;

  @IsString()
  DATABASE_URL!: string;

  @IsString()
  JWT_ACCESS_SECRET!: string;

  @IsString()
  JWT_REFRESH_SECRET!: string;

  @IsString()
  JWT_ACCESS_EXPIRES_IN: string = '15m';

  @IsString()
  JWT_REFRESH_EXPIRES_IN: string = '7d';

  @IsString()
  @IsOptional()
  CORS_ORIGIN?: string;

  @IsString()
  API_PREFIX: string = 'api/v1';

  @IsOptional()
  @IsString()
  REDIS_URL?: string;

  @IsString()
  GOOGLE_CLIENT_ID!: string;

  @IsString()
  GOOGLE_CLIENT_SECRET!: string;

  @IsString()
  GOOGLE_CALLBACK_URL!: string;

  @IsString()
  FRONTEND_URL!: string;

  @IsString()
  FRONTEND_CALLBACK_URL!: string;

  @IsString()
  BUNNY_STREAM_LIBRARY_ID!: string;

  @IsString()
  BUNNY_STREAM_API_KEY!: string;

  @IsString()
  BUNNY_STREAM_CDN_HOSTNAME!: string;

  @IsOptional()
  @IsString()
  BUNNY_STREAM_WEBHOOK_SECRET?: string;

  @IsOptional()
  @IsString()
  ZOOM_CLIENT_ID?: string;

  @IsOptional()
  @IsString()
  ZOOM_CLIENT_SECRET?: string;

  @IsOptional()
  @IsString()
  RESEND_API_KEY?: string;

  @IsOptional()
  @IsString()
  EMAIL_FROM_ADDRESS?: string;

  @IsOptional()
  @IsString()
  SMTP_HOST?: string;

  @IsOptional()
  @IsString()
  SMTP_PORT?: string;

  @IsOptional()
  @IsString()
  SMTP_USER?: string;

  @IsOptional()
  @IsString()
  SMTP_PASS?: string;

  @IsOptional()
  @IsString()
  SMTP_FROM?: string;

  @IsOptional()
  @IsString()
  APP_URL?: string;
}

export function validateEnv(config: Record<string, unknown>): EnvironmentVariables {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors: string[] = [];
  const required: (keyof EnvironmentVariables)[] = [
    'DATABASE_URL',
    'JWT_ACCESS_SECRET',
    'JWT_REFRESH_SECRET',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'GOOGLE_CALLBACK_URL',
    'FRONTEND_URL',
    'FRONTEND_CALLBACK_URL',
    'BUNNY_STREAM_LIBRARY_ID',
    'BUNNY_STREAM_API_KEY',
    'BUNNY_STREAM_CDN_HOSTNAME',
  ];

  for (const key of required) {
    if (!validated[key]) {
      errors.push(`${key} is required`);
    }
  }

  if (errors.length > 0) {
    throw new Error(`Environment validation failed:\n${errors.join('\n')}`);
  }

  return validated;
}
