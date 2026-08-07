import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from '../../../application/services/auth.service';
import { UserRepository } from '../../../infrastructure/repositories/user.repository';
import { RefreshTokenRepository } from '../../../infrastructure/repositories/refresh-token.repository';
import { JwtStrategy } from '../../strategies/jwt.strategy';
import { GoogleStrategy } from '../../strategies/google.strategy';

/**
 * Google OAuth is registered only when the required environment variables are
 * present. This keeps the API bootable (and email/password login usable) when
 * Google is not configured, while still wiring the strategy in production.
 */
const GoogleStrategyProvider = {
  provide: GoogleStrategy,
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => {
    const clientID = configService.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = configService.get<string>('GOOGLE_CLIENT_SECRET');
    const callbackURL = configService.get<string>('GOOGLE_CALLBACK_URL');

    if (!clientID || !clientSecret || !callbackURL) {
      return null;
    }

    return new GoogleStrategy({ clientID, clientSecret, callbackURL });
  },
};

@Module({
  imports: [PassportModule.register({ defaultStrategy: 'jwt' }), JwtModule.register({})],
  controllers: [AuthController],
  providers: [
    AuthService,
    UserRepository,
    RefreshTokenRepository,
    JwtStrategy,
    GoogleStrategyProvider,
  ],
  exports: [AuthService, UserRepository],
})
export class AuthModule {}
