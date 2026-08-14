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
  GoogleAuthDto,
  GoogleOAuthExchangeDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  VerifyEmailDto,
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
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate user and receive JWT tokens' })
  async login(@Body() dto: LoginDto): Promise<AuthTokensResponseDto> {
    const user = await this.authService.validateUser(dto.email, dto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }
    const tokens = await this.authService.generateTokens(user.id, user.email, user.role);
    const fullUser = await this.userRepository.findById(user.id);
    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: fullUser?.profile?.firstName,
        lastName: fullUser?.profile?.lastName,
        avatarUrl: fullUser?.profile?.avatarUrl ?? undefined,
      },
    };
  }

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new student account' })
  async register(@Body() dto: RegisterDto): Promise<AuthTokensResponseDto> {
    const tokens = await this.authService.register(dto);
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
  @Post('google')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate or register via Google ID token' })
  async google(@Body() dto: GoogleAuthDto): Promise<AuthTokensResponseDto> {
    const result = await this.authService.googleLogin(dto.token);
    const fullUser = await this.userRepository.findById(result.user.id);
    return {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      expiresIn: result.expiresIn,
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
  async me(@CurrentUser() user: AuthenticatedUser): Promise<UserResponseDto> {
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

  /**
   * Verify that the Google OAuth credentials are present in the environment.
   * Throws a clear configuration error instead of allowing a 404/500.
   */
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

  /**
   * @internal Resolve the frontend origin from the initiating request.
   * Prefers the FRONTEND_URL / FRONTEND_CALLBACK_URL env vars, then falls back
   * to the request's Origin / Referer headers so the user is always returned to
   * the frontend that started the OAuth flow (never the API host).
   */
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

  /**
   * Start the Google OAuth flow. Redirects the browser to Google's consent
   * screen. The `state` query parameter carries a short-lived CSRF token that
   * is validated when Google redirects back to the callback.
   */
  @Public()
  @Get('google')
  @ApiExcludeEndpoint()
  async googleRedirect(@Req() req: Request, @Res() res: Response): Promise<void> {
    this.assertGoogleConfigured();

    const state = this.authService.createOAuthRedirectState();

    // Capture the frontend origin so the callback can always return the user to
    // the correct frontend, even if FRONTEND_URL / FRONTEND_CALLBACK_URL are not
    // set on the deployed API. Prefer the explicit env var, then the request's
    // Origin / Referer header (present because the browser navigates here from
    // the frontend login page).
    let frontendOrigin = '';
    try {
      frontendOrigin = this.resolveFrontendOrigin(req);
    } catch {
      frontendOrigin = '';
    }

    // Preserve an optional post-login redirect target through the OAuth flow.
    const redirectParam = (req.query?.redirect as string | undefined) ?? '';
    const redirectTarget =
      redirectParam && redirectParam.startsWith('/') ? redirectParam : '';

    // State cookie format: <csrf>|<frontendOrigin>|<redirectPath>
    // The strategy validates only the CSRF token (first segment), so the
    // additional segments are safely carried through the OAuth round-trip.
    const stateWithRedirect = [
      state,
      encodeURIComponent(frontendOrigin),
      encodeURIComponent(redirectTarget),
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

  /**
   * @internal Parse the OAuth state cookie into { csrf, frontendOrigin, redirect }.
   */
  private parseStateCookie(req: Request): {
    csrf: string;
    frontendOrigin: string;
    redirect: string;
  } {
    const raw = this.readStateCookie(req);
    const fallback = { csrf: raw, frontendOrigin: '', redirect: '' };
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

    return { csrf: parts[0] ?? '', frontendOrigin, redirect };
  }

  /**
   * @internal Resolve the frontend Google callback page URL. Uses the frontend
   * origin captured at flow start (highest priority), then FRONTEND_CALLBACK_URL,
   * then the request origin.
   *
   * NOTE: This implementation always returns a frontend URL that ends with
   * `/login/google/callback` (never `/auth/google/callback`). It respects the
   * configured FRONTEND_CALLBACK_URL if provided but will rewrite an
   * `/auth/google/callback` value to the frontend `/login/google/callback` path.
   */
  private getFrontendCallbackUrl(req: Request, storedOrigin: string): string {
    const configured = this.configService
      .get<string>('FRONTEND_CALLBACK_URL')
      ?.replace(/\/+$/, '');

    // 1) If the frontend origin was captured at flow start, prefer it and
    //    resolve the standard frontend callback path (never `/auth/google/callback`).
    if (storedOrigin) {
      return `${storedOrigin.replace(/\/+$/, '')}/login/google/callback`;
    }

    // 2) If a configured frontend callback URL exists, respect it but ensure we
    //    never return a frontend path using `/auth/google/callback`. If the
    //    configured URL contains `/auth/google/callback`, rewrite to the
    //    frontend's `/login/google/callback` path.
    if (configured) {
      try {
        const url = new URL(configured);
        if (url.pathname.endsWith('/auth/google/callback')) {
          url.pathname = url.pathname.replace(/\/auth\/google\/callback$/, '/login/google/callback');
          return url.toString().replace(/\/+$/, '');
        }
        // Already points to the frontend callback path (for example /login/google/callback)
        // or some other explicit path — return as provided.
        return configured;
      } catch {
        // If configured isn't a full URL, fall back to the raw configured value.
        // (This keeps behaviour predictable if deploy used a partial value.)
        if (configured.includes('/auth/google/callback')) {
          return configured.replace(/\/auth\/google\/callback$/, '/login/google/callback');
        }
        return configured;
      }
    }

    // 3) Fallback: derive origin from request and use the frontend callback path.
    return `${this.resolveFrontendOrigin(req)}/login/google/callback`;
  }

  /**
   * @internal Resolve the frontend login URL for the error fallback. Uses the
   * frontend origin captured at flow start, then FRONTEND_URL, then the request
   * origin — so the user is never sent to the API host.
   */
  private getFrontendLoginUrl(req: Request, storedOrigin: string): string {
    const configured = this.configService.get<string>('FRONTEND_URL')?.replace(/\/+$/, '');
    const base = storedOrigin || configured || this.resolveFrontendOrigin(req);
    return `${base}/login?oauth_error=1`;
  }

  /**
   * Google OAuth callback. Passport verifies the authorization code and the
   * `state` parameter (CSRF). On success we create a one-time exchange code
   * and redirect the browser to the frontend callback page, which exchanges
   * the code for JWTs — keeping tokens out of the URL.
   *
   * Every redirect emitted here is an ABSOLUTE URL on the frontend domain.
   * The callback URL for Passport lives on the API, but the post-auth and
   * error redirects always point at the deployed frontend. A relative
   * redirect (e.g. `/login?...`) would incorrectly resolve against the API
   * host and produce `Cannot GET /login?oauth_error=1`.
   */
  @Public()
  @Get('google/callback')
  @ApiExcludeEndpoint()
  @UseGuards(AuthGuard('google'))
  async googleCallback(
    @Req() req: Request & { user: GoogleProfileUser },
    @Res() res: Response,
  ): Promise<void> {
    console.log('GOOGLE CALLBACK START');
    console.log('Passport user payload:', req.user);

    // Read the frontend origin + redirect target carried through the state cookie.
    const state = this.parseStateCookie(req);
    console.log('Parsed OAuth state from cookie:', state);

    try {
      console.log('Calling authService.googleOAuthLogin(...)');
      const user = await this.authService.googleOAuthLogin(req.user);
      console.log('authService.googleOAuthLogin returned:', user);

      console.log('Calling authService.createOAuthExchangeCode(...) for userId:', user.id);
      const code = await this.authService.createOAuthExchangeCode(user.id);
      console.log('authService.createOAuthExchangeCode returned code:', code);

      const frontendCallback = this.getFrontendCallbackUrl(req, state.frontendOrigin);
      console.log('Resolved frontend callback URL:', frontendCallback);

      const query =
        `?code=${encodeURIComponent(code)}` +
        (state.redirect && state.redirect.startsWith('/')
          ? `&redirect=${encodeURIComponent(state.redirect)}`
          : '');

      const redirectUrl = `${frontendCallback}${query}`;
      console.log('Redirecting to frontend callback (SUCCESS):', redirectUrl);

      // SUCCESS → redirect to the frontend callback page (absolute URL).
      res.redirect(redirectUrl);
    } catch (error) {
      // Log the full error and stack trace so the exact failing line is visible.
      console.error('Error during googleCallback flow:', error);
      if (error && (error as Error).stack) {
        console.error('Stack trace:', (error as Error).stack);
      }

      // Try to compute a safe, absolute frontend login URL and redirect there.
      try {
        const loginUrl = this.getFrontendLoginUrl(req, state.frontendOrigin);
        console.log('Redirecting to frontend login URL (error fallback):', loginUrl);
        res.redirect(loginUrl);
      } catch (innerErr) {
        // If even fallback resolution fails, log and send a last-resort redirect
        // (this will resolve relative to the API host).
        console.error('Failed to resolve frontend login URL, falling back to relative redirect. Error:', innerErr);
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

  /**
   * Exchange a one-time OAuth code (delivered to the frontend callback page)
   * for fresh JWT access/refresh tokens. This is called from the browser.
   */
  @Public()
  @Post('google/exchange')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Exchange Google OAuth code for JWT tokens' })
  async googleExchange(
    @Body() dto: GoogleOAuthExchangeDto,
  ): Promise<AuthTokensResponseDto> {
    const result = await this.authService.exchangeOAuthCode(dto.code);
    const user = await this.userRepository.findById(result.user.id);
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

  @Get('logout-all')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout from all devices' })
  async logoutAll(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.revokeAllSessions(user.id);
  }
}