import { IsEmail, IsString, MinLength, IsOptional, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@prisma/client';

const STRONG_PASSWORD = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;
const PASSWORD_MESSAGE = 'Password must contain at least 8 characters, an uppercase letter, a lowercase letter, a number, and a special character.';

export class LoginDto {
  @ApiProperty({ example: 'admin@platform.local' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'SuperAdmin@123' })
  @IsString()
  @Matches(STRONG_PASSWORD, { message: PASSWORD_MESSAGE })
  password!: string;
}

export class RegisterDto {
  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Password@123' })
  @IsString()
  @Matches(STRONG_PASSWORD, { message: PASSWORD_MESSAGE })
  password!: string;

  @ApiProperty({ example: 'John' })
  @IsString()
  firstName!: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  lastName!: string;

  @ApiPropertyOptional({ example: 'John Doe' })
  @IsOptional()
  @IsString()
  displayName?: string;
}

export class RefreshTokenDto {
  @ApiProperty()
  @IsString()
  refreshToken!: string;
}

export class GoogleOAuthExchangeDto {
  @ApiProperty({ description: 'One-time OAuth exchange code from the Google callback' })
  @IsString()
  code!: string;
}

export class ForgotPasswordDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email!: string;
}

export class ResetPasswordDto {
  @ApiProperty()
  @IsString()
  token!: string;

  @ApiProperty({ example: 'NewPassword@123' })
  @IsString()
  @Matches(STRONG_PASSWORD, { message: PASSWORD_MESSAGE })
  password!: string;
}

export class VerifyEmailDto {
  @ApiProperty()
  @IsString()
  token!: string;
}

export class ChangePasswordDto {
  @ApiProperty()
  @IsString()
  @Matches(STRONG_PASSWORD, { message: PASSWORD_MESSAGE })
  currentPassword!: string;

  @ApiProperty()
  @IsString()
  @Matches(STRONG_PASSWORD, { message: PASSWORD_MESSAGE })
  newPassword!: string;
}

export class AuthTokensResponseDto {
  @ApiProperty()
  accessToken!: string;

  @ApiProperty()
  refreshToken!: string;

  @ApiProperty()
  expiresIn!: number;

  @ApiPropertyOptional()
  @IsOptional()
  user?: {
    id: string;
    email: string;
    role: Role;
    firstName?: string;
    lastName?: string;
    avatarUrl?: string;
  };
}

export class UserResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty()
  role!: string;

  @ApiProperty({ required: false })
  firstName?: string;

  @ApiProperty({ required: false })
  lastName?: string;

  @ApiProperty({ required: false })
  avatarUrl?: string;

  @ApiProperty({ required: false })
  isActive?: boolean;

  @ApiProperty({ required: false })
  emailVerified?: boolean;

  @ApiProperty({ required: false })
  createdAt?: Date;
}

export class SessionDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ required: false })
  deviceId?: string | null;

  @ApiProperty({ required: false })
  ipAddress?: string | null;

  @ApiProperty({ required: false })
  userAgent?: string | null;

  @ApiProperty()
  expiresAt!: Date;

  @ApiProperty()
  lastActiveAt!: Date;

  @ApiProperty()
  status!: string;

  @ApiProperty()
  createdAt!: Date;
}

export class DeviceDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ required: false })
  deviceName?: string | null;

  @ApiProperty()
  deviceType!: string;

  @ApiProperty({ required: false })
  os?: string | null;

  @ApiProperty({ required: false })
  browser?: string | null;

  @ApiProperty({ required: false })
  ipAddress?: string | null;

  @ApiProperty()
  isTrusted!: boolean;

  @ApiProperty()
  lastUsedAt!: Date;

  @ApiProperty()
  createdAt!: Date;
}
