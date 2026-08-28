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
import { createHash, randomBytes } from 'crypto';
import { Response } from 'express';
import { Role, AccountProvider } from '@platform/database';
import { UserRepository } from '../../infrastructure/repositories/user.repository';
import { RefreshTokenRepository } from '../../infrastructure/repositories/refresh-token.repository';
import { EmailService } from '../../infrastructure/email/email.service';
import { IAuthService, ITokenPayload, ITokens } from '../../domain/services/auth.service.interface';

@Injectable()
export class AuthService implements IAuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
  ) {}

  async validateUser(
    email: string,
    password: string,
  ): Promise<{ id: string; email: string; role: Role } | null> {
    const user = await this.userRepository.findByEmail(email);
    if (!user || !user.passwordHash || !user.isActive || !user.emailVerified) {
      return null;
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return null;
    }

    await this.userRepository.updateLastLogin(user.id);

    return { id: user.id, email: user.email, role: user.role };
  }

  async login(email: string, password: string): Promise<ITokens> {
    const existing = await this.userRepository.findByEmail(email);
    if (!existing) throw new UnauthorizedException({ code: 'ACCOUNT_NOT_FOUND', message: 'No account found with this email. Please sign up first.' });
    if (!existing.isActive) throw new UnauthorizedException({ code: 'UNAUTHORIZED', message: 'This account is unavailable.' });
    if (!existing.emailVerified) throw new UnauthorizedException({ code: 'EMAIL_NOT_VERIFIED', message: 'Please verify your email address to continue.' });
    if (!existing.passwordHash || !(await bcrypt.compare(password, existing.passwordHash))) {
      throw new UnauthorizedException({ code: 'INVALID_PASSWORD', message: 'Incorrect password. Please try again.' });
    }
    await this.userRepository.updateLastLogin(existing.id);

    return this.generateTokens(existing.id, existing.email, existing.role);
  }

  async register(dto: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    displayName?: string;
  }): Promise<{ message: string }> {
    const existing = await this.userRepository.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException({ code: 'EMAIL_ALREADY_EXISTS', message: 'This email is already registered.' });
    }

    this.assertStrongPassword(dto.password);

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.userRepository.create({
      email: dto.email,
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
      displayName: dto.displayName,
      role: Role.STUDENT,
    });

    const verificationToken = await this.generateEmailVerification(user.id);
    try {
      await this.emailService.sendEmailVerificationEmail(user.email, verificationToken);
    } catch (error) {
      await this.userRepository.invalidateEmailVerificationTokens(user.id);
      throw error;
    }

    return { message: 'Please verify your email address to continue.' };
  }

/**
   * OAuth flow (passport-google-oauth20). Given a verified Google profile,
   * log in an existing account, auto-provision a new one, or link the Google
   * identity to an existing email/password account. Only performs the DB
   * provisioning — token issuance is delegated to generateTokens().
   */
  async googleOAuthLogin(profile: {
    googleId: string;
    email: string;
    emailVerified?: boolean;
    firstName?: string;
    lastName?: string;
    displayName?: string;
    avatarUrl?: string;
  }, intent: 'signin' | 'signup' = 'signin'): Promise<{ id: string; email: string; role: Role }> {
    if (!profile?.googleId || !profile?.email) {
      throw new UnauthorizedException('Invalid Google profile');
    }

    const email = profile.email.toLowerCase();

    // 1) Existing Google-linked account → sign in.
    let user = await this.userRepository.findByProviderAccountId(
      AccountProvider.GOOGLE,
      profile.googleId,
    );

    // 2) Otherwise look up by email for account linking.
    let isNewUser = false;
    if (!user) {
      user = await this.userRepository.findByEmail(email);
      isNewUser = !user;
    }

    if (isNewUser) {
      if (intent !== 'signup') {
        throw new ConflictException({ code: 'GOOGLE_ACCOUNT_NOT_REGISTERED', message: 'No account exists with this Google email. Please create an account first.' });
      }
      if (!profile.emailVerified) {
        throw new UnauthorizedException('Google email ownership could not be verified');
      }
      user = await this.userRepository.create({
        email,
        passwordHash: null,
        firstName: profile.firstName ?? '',
        lastName: profile.lastName ?? '',
        displayName: profile.displayName,
        avatarUrl: profile.avatarUrl,
        role: Role.STUDENT,
        googleId: profile.googleId,
        emailVerified: true,
      });
    } else {
      if (!user) {
        throw new UnauthorizedException('Account is suspended');
      }
      const alreadyLinked = await this.userRepository.findByProviderAccountId(
        AccountProvider.GOOGLE,
        profile.googleId,
      );
      if (!alreadyLinked) {
        if (intent === 'signup') {
          throw new ConflictException({ code: 'GOOGLE_ACCOUNT_ALREADY_EXISTS', message: 'An account already exists with this email. Please sign in instead.' });
        }
        if (!profile.emailVerified) {
          throw new UnauthorizedException('Google email ownership could not be verified');
        }
        await this.userRepository.linkGoogleAccount(user.id, profile.googleId);
        if (!user.emailVerified) await this.userRepository.markEmailVerified(user.id);
      }
      await this.userRepository.updateGoogleProfile(user.id, {
        firstName: profile.firstName,
        lastName: profile.lastName,
        displayName: profile.displayName,
        avatarUrl: profile.avatarUrl,
      });
    }

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Account is suspended');
    }
    if (!user.emailVerified) {
      throw new UnauthorizedException('Please verify your email address to continue.');
    }

    await this.userRepository.updateLastLogin(user.id);

    return { id: user.id, email: user.email, role: user.role };
  }

  /**
   * Generate a random CSRF state value used by the Google OAuth redirect.
   */
  createOAuthRedirectState(): string {
    return uuidv4();
  }

  /**
   * Set the OAuth state value in a short-lived, HttpOnly cookie so the
   * callback handler can validate the `state` echo from Google (CSRF).
   */
  setOAuthStateCookie(res: Response, state: string): void {
    const secure = this.configService.get<string>('NODE_ENV') === 'production';
    res.cookie('oauth_state', state, {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      maxAge: 10 * 60 * 1000, // 10 minutes
      path: '/',
    });
  }

  /**
   * Generate a short-lived one-time code used to hand the OAuth JWT to the
   * frontend without exposing tokens in the URL (cross-domain safe).
   */
  async createOAuthExchangeCode(userId: string): Promise<string> {
    const code = uuidv4();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    await this.userRepository.createOAuthState({ userId, code, expiresAt });
    return code;
  }

  /**
   * Exchange a one-time OAuth code for fresh JWT access/refresh tokens.
   */
  async exchangeOAuthCode(
    code: string,
  ): Promise<ITokens & { user: { id: string; email: string; role: Role } }> {
    if (!code) {
      throw new BadRequestException('OAuth code is required');
    }

    const state = await this.userRepository.findOAuthStateByCode(code);
    if (!state || state.usedAt || state.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired OAuth code');
    }

    await this.userRepository.markOAuthStateUsed(state.id);

    const user = await this.userRepository.findById(state.userId);
    if (!user || !user.isActive || !user.emailVerified) {
      throw new UnauthorizedException('User not found or inactive');
    }

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

    const token = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 30 * 60_000);

    await this.userRepository.createPasswordResetToken({
      userId: user.id,
      email,
      token: tokenHash,
      expiresAt,
    });

    try {
      await this.emailService.sendPasswordResetEmail(email, token);
    } catch {
      await this.userRepository.invalidatePasswordResetToken(tokenHash);
    }

    return { message: 'If that email exists, a password reset link has been sent.' };
  }

  async resetPassword(token: string, password: string): Promise<{ message: string }> {
    this.assertStrongPassword(password);
    const passwordHash = await bcrypt.hash(password, 12);
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const userId = await this.userRepository.resetPasswordWithToken(tokenHash, passwordHash);
    if (!userId) throw new BadRequestException('Invalid or expired reset token');

    await this.refreshTokenRepository.revokeByUserId(userId);

    return { message: 'Password has been reset successfully' };
  }

  async generateEmailVerification(userId: string): Promise<string> {
    const token = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 24 * 3600_000);
    await this.userRepository.createEmailVerificationToken({
      userId,
      token: tokenHash,
      expiresAt,
    });
    return token;
  }

  async verifyEmail(token: string): Promise<{ message: string }> {
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const consumed = await this.userRepository.consumeEmailVerificationToken(tokenHash, new Date());
    if (!consumed) {
      throw new BadRequestException('The verification code is invalid or has expired.');
    }

    await this.userRepository.markEmailVerified(consumed.userId);
    return { message: 'Your email has been successfully verified.' };
  }

  async resendEmailVerification(email: string): Promise<{ message: string }> {
    const genericMessage = 'If that email is eligible, a new verification email has been sent.';
    const user = await this.userRepository.findByEmail(email);
    if (!user || user.emailVerified || !user.isActive) return { message: genericMessage };

    const since = new Date(Date.now() - 60_000);
    if (await this.userRepository.countRecentEmailVerificationTokens(user.id, since) > 0) {
      return { message: genericMessage };
    }

    const token = await this.generateEmailVerification(user.id);
    try {
      await this.emailService.sendEmailVerificationEmail(user.email, token);
    } catch {
      await this.userRepository.invalidateEmailVerificationTokens(user.id);
      return { message: genericMessage };
    }
    return { message: 'A new verification email has been sent.' };
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    this.assertStrongPassword(newPassword);
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

  private assertStrongPassword(password: string): void {
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/.test(password)) {
      throw new BadRequestException({ code: 'WEAK_PASSWORD', message: 'Password must contain at least 8 characters, an uppercase letter, a lowercase letter, a number, and a special character.' });
    }
  }
}
