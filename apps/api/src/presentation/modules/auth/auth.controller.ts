import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from '../../../application/services/auth.service';
import { Public } from '../../decorators/public.decorator';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { AuthenticatedUser } from '../../strategies/jwt.strategy';
import { LoginDto, RefreshTokenDto, AuthTokensResponseDto, UserResponseDto } from './dto/auth.dto';
import { UserRepository } from '../../../infrastructure/repositories/user.repository';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userRepository: UserRepository,
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
    return this.authService.generateTokens(user.id, user.email, user.role);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  async refresh(@Body() dto: RefreshTokenDto): Promise<AuthTokensResponseDto> {
    return this.authService.refreshTokens(dto.refreshToken);
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
    };
  }
}
