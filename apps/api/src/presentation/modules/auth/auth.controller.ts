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

  /**
   * Start the Google OAuth flow. Redirects the browser to Google's consent
   * screen. The `state` query parameter carries a short-lived CSRF token that
   * is validated when Google redirects back to the callback.
   */
  @Public()
  @Get('google')
  @ApiExcludeEndpoint()
  async googleRedirect(@Res() res: Response): Promise<void> {
    const state = this.authService.createOAuthRedirectState();
    this.authService.setOAuthStateCookie(res, state);
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    const redirectUri = this.configService.get<string>('GOOGLE_CALLBACK_URL');
    if (!clientId || !redirectUri) {
      throw new UnauthorizedException('Google OAuth is not configured');
    }
    const scope = encodeURIComponent('email profile');
    const url =
      `https://accounts.google.com/o/oauth2/v2/auth?response_type=code` +
      `&client_id=${encodeURIComponent(clientId)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&scope=${scope}` +
      `&state=${encodeURIComponent(state)}` +
      `&access_type=offline&prompt=consent`;
    res.redirect(url);
  }

  /**
   * Google OAuth callback. Passport verifies the authorization code and the
   * `state` parameter (CSRF). On success we create a one-time exchange code
   * and redirect the browser to the frontend callback page, which exchanges
   * the code for JWTs — keeping tokens out of the URL.
   */
  @Public()
  @Get('google/callback')
  @ApiExcludeEndpoint()
  @UseGuards(AuthGuard('google'))
  async googleCallback(
    @Req() req: Request & { user: GoogleProfileUser },
    @Res() res: Response,
  ): Promise<void> {
    try {
      const user = await this.authService.googleOAuthLogin(req.user);
      const code = await this.authService.createOAuthExchangeCode(user.id);
      const frontendUrl = this.configService.get<string>(
        'FRONTEND_CALLBACK_URL',
        'http://localhost:3000/auth/google/callback',
      );
      res.redirect(`${frontendUrl}?code=${encodeURIComponent(code)}`);
    } catch {
      const frontendUrl = this.configService.get<string>(
        'FRONTEND_URL',
        'http://localhost:3000/login',
      );
      res.redirect(`${frontendUrl}?oauth_error=1`);
    }
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

  @Get('logout-all')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout from all devices' })
  async logoutAll(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.revokeAllSessions(user.id);
  }
}
