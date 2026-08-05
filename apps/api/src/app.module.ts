import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { validateEnv } from './infrastructure/config/env.validation';
import { PrismaModule } from './infrastructure/database/prisma.module';
import { AuthModule } from './presentation/modules/auth/auth.module';
import { HealthModule } from './presentation/modules/health/health.module';
import { StudentsModule } from './presentation/modules/students/students.module';
import { UsersModule } from './presentation/modules/users/users.module';
import { CoursesModule } from './presentation/modules/courses/courses.module';
import { TeacherModule } from './presentation/modules/teacher/teacher.module';
import { JwtAuthGuard } from './presentation/guards/jwt-auth.guard';
import { RolesGuard } from './presentation/guards/roles.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
      envFilePath: ['.env', '.env.local', '../../.env', '../../.env.local'],
    }),
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,
        limit: 10,
      },
      {
        name: 'medium',
        ttl: 60000,
        limit: 100,
      },
    ]),
    PrismaModule,
    AuthModule,
    HealthModule,
    StudentsModule,
    UsersModule,
    CoursesModule,
    TeacherModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
