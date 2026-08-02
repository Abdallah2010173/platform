import { Role } from '@platform/database';

export interface IAuthService {
  validateUser(email: string, password: string): Promise<{ id: string; email: string; role: Role } | null>;
  generateTokens(userId: string, email: string, role: Role): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }>;
  refreshTokens(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }>;
  revokeRefreshToken(refreshToken: string): Promise<void>;
}

export const AUTH_SERVICE = Symbol('AUTH_SERVICE');

export interface ITokenPayload {
  sub: string;
  email: string;
  role: Role;
}

export interface ITokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}
