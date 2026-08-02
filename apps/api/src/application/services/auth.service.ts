import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { Role } from '@platform/database';
import { UserRepository } from '../../infrastructure/repositories/user.repository';
import { RefreshTokenRepository } from '../../infrastructure/repositories/refresh-token.repository';
import { IAuthService, ITokenPayload, ITokens } from '../../domain/services/auth.service.interface';

@Injectable()
export class AuthService implements IAuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async validateUser(
    email: string,
    password: string,
  ): Promise<{ id: string; email: string; role: Role } | null> {
    const user = await this.userRepository.findByEmail(email);
    if (!user || !user.passwordHash || !user.isActive) {
      return null;
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return null;
    }

    await this.userRepository.updateLastLogin(user.id);

    return { id: user.id, email: user.email, role: user.role };
  }

  async generateTokens(userId: string, email: string, role: Role): Promise<ITokens> {
    const payload: ITokenPayload = { sub: userId, email, role };

    const accessExpiresIn = this.configService.get<string>('JWT_ACCESS_EXPIRES_IN', '15m');
    const refreshExpiresIn = this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d');

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      expiresIn: accessExpiresIn,
    });

    const family = uuidv4();
    const refreshTokenValue = uuidv4();
    const refreshExpiresMs = this.parseExpiry(refreshExpiresIn);

    await this.refreshTokenRepository.create({
      userId,
      token: refreshTokenValue,
      family,
      expiresAt: new Date(Date.now() + refreshExpiresMs),
    });

    const refreshToken = this.jwtService.sign(
      { sub: userId, token: refreshTokenValue, family },
      {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: refreshExpiresIn,
      },
    );

    const expiresInSeconds = this.parseExpiry(accessExpiresIn) / 1000;

    return { accessToken, refreshToken, expiresIn: expiresInSeconds };
  }

  async refreshTokens(refreshToken: string): Promise<ITokens> {
    let payload: { sub: string; token: string; family: string };

    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const storedToken = await this.refreshTokenRepository.findByToken(payload.token);

    if (!storedToken || storedToken.revokedAt || storedToken.expiresAt < new Date()) {
      if (storedToken?.revokedAt) {
        await this.refreshTokenRepository.revokeByFamily(payload.family);
      }
      throw new UnauthorizedException('Refresh token expired or revoked');
    }

    await this.refreshTokenRepository.revokeToken(storedToken.id);

    const user = await this.userRepository.findById(payload.sub);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    return this.generateTokens(user.id, user.email, user.role);
  }

  async revokeRefreshToken(refreshToken: string): Promise<void> {
    try {
      const payload = this.jwtService.verify<{ token: string; family: string }>(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });
      await this.refreshTokenRepository.revokeByFamily(payload.family);
    } catch {
      // Token already invalid — no action needed
    }
  }

  private parseExpiry(expiry: string): number {
    const match = expiry.match(/^(\d+)([smhd])$/);
    if (!match) return 900000;

    const value = parseInt(match[1]!, 10);
    const unit = match[2]!;

    const multipliers: Record<string, number> = {
      s: 1000,
      m: 60000,
      h: 3600000,
      d: 86400000,
    };

    return value * (multipliers[unit] ?? 60000);
  }
}
