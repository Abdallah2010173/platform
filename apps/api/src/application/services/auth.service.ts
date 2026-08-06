import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
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

  async register(dto: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    displayName?: string;
  }): Promise<ITokens> {
    const existing = await this.userRepository.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.userRepository.create({
      email: dto.email,
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
      displayName: dto.displayName,
      role: Role.STUDENT,
    });

    return this.generateTokens(user.id, user.email, user.role);
  }

  /**
   * Authenticate a user via a Google ID token (from Google Identity Services).
   * Verifies the token with Google's tokeninfo endpoint, then either returns
   * tokens for an existing account or provisions one on first login.
   */
  async googleLogin(
    token: string,
  ): Promise<ITokens & { user: { id: string; email: string; role: Role } }> {
    if (!token) {
      throw new BadRequestException('Google token is required');
    }

    let googleProfile: {
      email: string;
      email_verified: boolean;
      given_name?: string;
      family_name?: string;
      name?: string;
      picture?: string;
    };

    try {
      const res = await fetch(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(token)}`,
      );
      if (!res.ok) {
        throw new Error(`Google verification failed with status ${res.status}`);
      }
      googleProfile = (await res.json()) as typeof googleProfile;
    } catch {
      throw new UnauthorizedException('Invalid Google token');
    }

    if (!googleProfile.email) {
      throw new UnauthorizedException('Google account has no email address');
    }

    const email = googleProfile.email.toLowerCase();

    let user = await this.userRepository.findByEmail(email);

    if (!user) {
      // First login — auto-provision a student account.
      const displayName =
        googleProfile.name ??
        `${googleProfile.given_name ?? ''} ${googleProfile.family_name ?? ''}`.trim();
      user = await this.userRepository.create({
        email,
        passwordHash: '', // No password — Google-authenticated account
        firstName: googleProfile.given_name ?? '',
        lastName: googleProfile.family_name ?? '',
        displayName: displayName || undefined,
        role: Role.STUDENT,
      });
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is suspended');
    }

    await this.userRepository.updateLastLogin(user.id);

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    return { ...tokens, user: { id: user.id, email: user.email, role: user.role } };
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

  async forgotPassword(email: string): Promise<{ message: string }> {
    const user = await this.userRepository.findByEmail(email);
    // Always return generic message to avoid user enumeration
    if (!user) {
      return { message: 'If that email exists, a password reset link has been sent.' };
    }

    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 3600_000); // 1 hour

    await this.userRepository.createPasswordResetToken({
      userId: user.id,
      email,
      token,
      expiresAt,
    });

    return { message: 'If that email exists, a password reset link has been sent.' };
  }

  async resetPassword(token: string, password: string): Promise<{ message: string }> {
    const resetToken = await this.userRepository.findPasswordResetToken(token);
    if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    if (!resetToken.userId) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await this.userRepository.updatePassword(resetToken.userId, passwordHash);
    await this.userRepository.markPasswordResetTokenUsed(resetToken.id);

    return { message: 'Password has been reset successfully' };
  }

  async generateEmailVerification(userId: string): Promise<string> {
    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 24 * 3600_000); // 24 hours
    await this.userRepository.createEmailVerificationToken({
      userId,
      token,
      expiresAt,
    });
    return token;
  }

  async verifyEmail(token: string): Promise<{ message: string }> {
    const verificationToken = await this.userRepository.findEmailVerificationToken(token);
    if (
      !verificationToken ||
      verificationToken.usedAt ||
      verificationToken.expiresAt < new Date()
    ) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    if (!verificationToken.userId) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    await this.userRepository.markEmailVerified(verificationToken.userId);
    await this.userRepository.markEmailVerificationTokenUsed(verificationToken.id);

    return { message: 'Email verified successfully' };
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    const user = await this.userRepository.findById(userId);
    if (!user || !user.passwordHash) {
      throw new NotFoundException('User not found');
    }

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.userRepository.updatePassword(userId, passwordHash);

    return { message: 'Password changed successfully' };
  }

  async getUserSessions(userId: string) {
    return this.userRepository.findSessions(userId);
  }

  async revokeSession(userId: string, sessionId: string) {
    return this.userRepository.revokeSession(userId, sessionId);
  }

  async revokeAllSessions(userId: string) {
    return this.userRepository.revokeAllSessions(userId);
  }

  async getUserDevices(userId: string) {
    return this.userRepository.findDevices(userId);
  }

  async revokeDevice(userId: string, deviceId: string) {
    return this.userRepository.revokeDevice(userId, deviceId);
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
