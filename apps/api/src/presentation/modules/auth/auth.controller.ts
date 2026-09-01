import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
  ConflictException,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiExcludeEndpoint } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from '../../../application/services/auth.service';
import { Public } from '../../decorators/public.decorator';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { AuthenticatedUser } from '../../strategies/jwt.strategy';
import { GoogleProfileUser } from '../../strategies/google.strategy';
import {
  LoginDto,
  RegisterDto,
  RefreshTokenDto,
  GoogleOAuthExchangeDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  VerifyEmailDto,
  VerifyOtpDto,
  SetPasswordDto,
  ResendVerificationDto,
  ChangePasswordDto,
  AuthTokensResponseDto,
  UserResponseDto,
} from './dto/auth.dto';
import { UserRepository } from '../../../infrastructure/repositories/user.repository';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userRepository: UserRepository,
    private readonly configService: ConfigService,
  ) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new student account' })
  async register(@Body() dto: RegisterDto): Promise<{ message: string }> {
    return this.authService.register(dto);
  }

// src/presentation/modules/auth/auth.controller.ts

// src/presentation/modules/auth/auth.controller.ts

@Public()
@Post('login')
@HttpCode(HttpStatus.OK)
@ApiOperation({ summary: 'Login with email and password' })
async login(@Body() dto: LoginDto): Promise<AuthTokensResponseDto> {
  const tokens = await this.authService.login(dto.email, dto.password);
  const fullUser = await this.userRepository.findByEmail(dto.email);
  return {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    expiresIn: tokens.expiresIn,
    user: fullUser
      ? {
          id: fullUser.id,
          email: fullUser.email,
          role: fullUser.role,
          firstName: fullUser.profile?.firstName,
          lastName: fullUser.profile?.lastName,
          avatarUrl: fullUser.profile?.avatarUrl ?? undefined,
        }
      : undefined,
  };
}

  @Public()
  @Post('google/exchange')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Exchange Google OAuth code for JWT tokens' })
  async googleExchange(
    @Body() dto: GoogleOAuthExchangeDto,
  ): Promise<AuthTokensResponseDto> {
    const result = await this.authService.exchangeOAuthCode(dto.code);

    const userId = result.user.id;
    const user = await this.userRepository.findById(userId);

    return {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      expiresIn: result.expiresIn,
      user: user
        ? {
            id: user.id,
            email: user.email,
            role: user.role,
            firstName: user.profile?.firstName,
            lastName: user.profile?.lastName,
            avatarUrl: user.profile?.avatarUrl ?? undefined,
          }
        : undefined,
    };
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  async refresh(@Body() dto: RefreshTokenDto): Promise<AuthTokensResponseDto> {
    return this.authService.refreshTokens(dto.refreshToken);
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request a password reset link' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password with a token' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.password);
  }

  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify email with a token' })
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto.token);
  }

  @Public()
  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify a registration OTP code and issue tokens' })
  async verifyOtp(@Body() dto: VerifyOtpDto): Promise<AuthTokensResponseDto> {
    const tokens = await this.authService.verifyOtp(dto.email, dto.otp);
    const fullUser = await this.userRepository.findByEmail(dto.email);
    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
      user: fullUser
        ? {
            id: fullUser.id,
            email: fullUser.email,
            role: fullUser.role,
            firstName: fullUser.profile?.firstName,
            lastName: fullUser.profile?.lastName,
            avatarUrl: fullUser.profile?.avatarUrl ?? undefined,
          }
        : undefined,
    };
  }

  @Post('set-password')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Set a password for a Google-created account' })
  async setPassword(@CurrentUser() user: AuthenticatedUser, @Body() dto: SetPasswordDto) {
    return this.authService.setPasswordForGoogleUser(user.id, dto.password);
  }

  @Public()
  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend an email verification link' })
  async resendVerification(@Body() dto: ResendVerificationDto) {
    return this.authService.resendEmailVerification(dto.email);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke refresh token and logout' })
  async logout(@Body() dto: RefreshTokenDto): Promise<void> {
    await this.authService.revokeRefreshToken(dto.refreshToken);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated user' })
  async getMe(@CurrentUser() user: AuthenticatedUser): Promise<UserResponseDto> {
    const fullUser = await this.userRepository.findById(user.id);
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: fullUser?.profile?.firstName,
      lastName: fullUser?.profile?.lastName,
      avatarUrl: fullUser?.profile?.avatarUrl ?? undefined,
      isActive: fullUser?.isActive,
      emailVerified: !!fullUser?.emailVerified,
      createdAt: fullUser?.createdAt,
    };
  }

  @Post('change-password')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change the current user password' })
  async changePassword(@CurrentUser() user: AuthenticatedUser, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(user.id, dto.currentPassword, dto.newPassword);
  }

  @Get('sessions')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List active sessions for the current user' })
  async getSessions(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.getUserSessions(user.id);
  }

  @Delete('sessions/:sessionId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke a specific session' })
  async revokeSession(
    @CurrentUser() user: AuthenticatedUser,
    @Param('sessionId') sessionId: string,
  ) {
    return this.authService.revokeSession(user.id, sessionId);
  }

  @Delete('sessions')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke all sessions for the current user' })
  async revokeAllSessions(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.revokeAllSessions(user.id);
  }

  @Get('devices')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List devices for the current user' })
  async getDevices(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.getUserDevices(user.id);
  }

  @Delete('devices/:deviceId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke a device and its sessions' })
  async revokeDevice(@CurrentUser() user: AuthenticatedUser, @Param('deviceId') deviceId: string) {
    return this.authService.revokeDevice(user.id, deviceId);
  }

  private assertGoogleConfigured(): void {
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = this.configService.get<string>('GOOGLE_CLIENT_SECRET');
    const callbackURL = this.configService.get<string>('GOOGLE_CALLBACK_URL');
    if (!clientId || !clientSecret || !callbackURL) {
      throw new UnauthorizedException(
        'Google OAuth is not configured. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET and GOOGLE_CALLBACK_URL.',
      );
    }
  }

  private resolveFrontendOrigin(req: Request): string {
    const fromEnv =
      this.configService.get<string>('FRONTEND_URL')?.replace(/\/+$/, '') ??
      this.configService.get<string>('FRONTEND_CALLBACK_URL')?.replace(/\/+$/, '');

    if (fromEnv) return fromEnv;

    const forwardedProto = req.headers['x-forwarded-proto']?.toString().split(',')[0]?.trim();
    const forwardedHost = req.headers['x-forwarded-host']?.toString().split(',')[0]?.trim();
    if (forwardedHost) {
      const proto = forwardedProto || (req.secure ? 'https' : 'http');
      return `${proto}://${forwardedHost}`.replace(/\/+$/, '');
    }

    const origin = req.headers?.origin?.replace(/\/+$/, '');
    if (origin) return origin;

    const referer = req.headers?.referer;
    if (referer) {
      try {
        const refererOrigin = new URL(referer).origin;
        if (refererOrigin) return refererOrigin;
      } catch {
        // ignore malformed referer
      }
    }

    throw new UnauthorizedException(
      'FRONTEND_URL is not configured and the request origin could not be determined. Set FRONTEND_URL to your frontend URL.',
    );
  }

  @Public()
  @Get('google')
  @ApiExcludeEndpoint()
  async googleRedirect(@Req() req: Request, @Res() res: Response): Promise<void> {
    this.assertGoogleConfigured();

    const state = this.authService.createOAuthRedirectState();

    let frontendOrigin = '';
    try {
      frontendOrigin = this.resolveFrontendOrigin(req);
    } catch {
      frontendOrigin = '';
    }

    const redirectParam = (req.query?.redirect as string | undefined) ?? '';
    const redirectTarget =
      redirectParam && redirectParam.startsWith('/') ? redirectParam : '';

    const intent = req.query?.intent === 'signup' ? 'signup' : 'signin';
    const stateWithRedirect = [
      state,
      encodeURIComponent(frontendOrigin),
      encodeURIComponent(redirectTarget),
      intent,
    ].join('|');

    this.authService.setOAuthStateCookie(res, stateWithRedirect);

    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID')!;
    const redirectUri = this.configService.get<string>('GOOGLE_CALLBACK_URL')!;
    const scope = encodeURIComponent('email profile');
    const url =
      `https://accounts.google.com/o/oauth2/v2/auth?response_type=code` +
      `&client_id=${encodeURIComponent(clientId)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&scope=${scope}` +
      `&state=${encodeURIComponent(stateWithRedirect)}` +
      `&access_type=offline&prompt=consent`;
    res.redirect(url);
  }

  private parseStateCookie(req: Request): {
    csrf: string;
    frontendOrigin: string;
    redirect: string;
    intent: 'signin' | 'signup';
  } {
    const raw = this.readStateCookie(req);
    const fallback = { csrf: raw, frontendOrigin: '', redirect: '', intent: 'signin' as const };
    if (!raw) return fallback;

    const parts = raw.split('|');
    if (parts.length < 3) return fallback;

    let frontendOrigin = '';
    try {
      frontendOrigin = decodeURIComponent(parts[1] ?? '');
    } catch {
      frontendOrigin = '';
    }
    let redirect = '';
    try {
      redirect = decodeURIComponent(parts[2] ?? '');
    } catch {
      redirect = '';
    }

    const intent = parts[3] === 'signup' ? 'signup' : 'signin';
    return { csrf: parts[0] ?? '', frontendOrigin, redirect, intent };
  }

  private getFrontendCallbackUrl(req: Request, storedOrigin: string): string {
    const configured = this.configService
      .get<string>('FRONTEND_CALLBACK_URL')
      ?.replace(/\/+$/, '');

    if (storedOrigin) {
      return `${storedOrigin.replace(/\/+$/, '')}/auth/google/callback`;
    }

    if (configured) {
      try {
        const url = new URL(configured);
        if (!url.pathname || url.pathname === '/') {
          url.pathname = '/auth/google/callback';
        }
        return url.toString().replace(/\/+$/, '');
      } catch {
        if (!configured.includes('/auth/google/callback')) {
          return `${configured}/auth/google/callback`;
        }
        return configured;
      }
    }

    return `${this.resolveFrontendOrigin(req)}/auth/google/callback`;
  }

  private getFrontendLoginUrl(req: Request, storedOrigin: string): string {
    const configured = this.configService.get<string>('FRONTEND_URL')?.replace(/\/+$/, '');
    const base = storedOrigin || configured || this.resolveFrontendOrigin(req);
    return `${base}/login?oauth_error=google_signin_failed`;
  }

  @Public()
  @Get('google/callback')
  @ApiExcludeEndpoint()
  @UseGuards(AuthGuard('google'))
  async googleCallback(
    @Req() req: Request & { user: GoogleProfileUser },
    @Res() res: Response,
  ): Promise<void> {
    const state = this.parseStateCookie(req);

    try {
      const user = await this.authService.googleOAuthLogin(req.user, state.intent);
      const code = await this.authService.createOAuthExchangeCode(user.id);
      const frontendCallback = this.getFrontendCallbackUrl(req, state.frontendOrigin);

      const query =
        `?code=${encodeURIComponent(code)}` +
        (state.redirect && state.redirect.startsWith('/')
          ? `&redirect=${encodeURIComponent(state.redirect)}`
          : '');

      const redirectUrl = `${frontendCallback}${query}`;
      res.redirect(redirectUrl);
    } catch (error) {
      const code = error instanceof ConflictException ? (error.getResponse() as { code?: string }).code : undefined;
      try {
        const base = state.frontendOrigin || this.configService.get<string>('FRONTEND_URL') || this.resolveFrontendOrigin(req);
        const errorCode = code === 'GOOGLE_ACCOUNT_NOT_REGISTERED'
          ? 'google_account_not_registered'
          : code === 'GOOGLE_ACCOUNT_ALREADY_EXISTS'
            ? 'google_account_already_exists'
            : code === 'GOOGLE_ACCOUNT_LINK_REQUIRED'
              ? 'google_account_link_required'
              : 'google_signin_failed';
        const destination = code === 'GOOGLE_ACCOUNT_NOT_REGISTERED' ? 'register' : 'login';
        res.redirect(`${base.replace(/\/+$/, '')}/${destination}?oauth_error=${errorCode}`);
      } catch (innerErr) {
        console.error('Inner error:', innerErr);
        res.redirect('/login?oauth_error=1');
      }
    }
  }

  private readStateCookie(req: Request): string {
    const header = req.headers?.cookie;
    if (!header) return '';
    for (const part of header.split(';')) {
      const idx = part.indexOf('=');
      if (idx === -1) continue;
      const key = part.slice(0, idx).trim();
      const value = part.slice(idx + 1).trim();
      if (key === 'oauth_state') {
        try {
          return decodeURIComponent(value);
        } catch {
          return value;
        }
      }
    }
    return '';
  }

  @Get('logout-all')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout from all devices' })
  async logoutAll(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.revokeAllSessions(user.id);
  }
}