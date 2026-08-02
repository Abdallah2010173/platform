import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { APP_GUARD } from '@nestjs/core';
import { AuthController } from './auth.controller';
import { AuthService } from '../../../application/services/auth.service';
import { UserRepository } from '../../../infrastructure/repositories/user.repository';
import { RefreshTokenRepository } from '../../../infrastructure/repositories/refresh-token.repository';
import { JwtStrategy } from '../../strategies/jwt.strategy';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';

@Module({
  imports: [PassportModule.register({ defaultStrategy: 'jwt' }), JwtModule.register({})],
  controllers: [AuthController],
  providers: [
    AuthService,
    UserRepository,
    RefreshTokenRepository,
    JwtStrategy,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
  exports: [AuthService, UserRepository],
})
export class AuthModule {}
