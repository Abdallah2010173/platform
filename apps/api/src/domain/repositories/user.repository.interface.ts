import { Role } from '@platform/database';

export interface IUser {
  id: string;
  email: string;
  passwordHash: string | null;
  role: Role;
  emailVerified: Date | null;
  twoFactorEnabled: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IProfile {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  displayName: string | null;
  avatarUrl: string | null;
}

export interface IUserWithProfile extends IUser {
  profile: IProfile | null;
}

export interface IRefreshToken {
  id: string;
  userId: string;
  token: string;
  family: string;
  expiresAt: Date;
  revokedAt: Date | null;
}

export interface CreateUserData {
  email: string;
  passwordHash: string;
  role?: Role;
  firstName: string;
  lastName: string;
  displayName?: string;
}

export interface IUserRepository {
  findById(id: string): Promise<IUserWithProfile | null>;
  findByEmail(email: string): Promise<IUserWithProfile | null>;
  create(data: CreateUserData): Promise<IUserWithProfile>;
  updateLastLogin(id: string): Promise<void>;
}

export interface IRefreshTokenRepository {
  create(data: {
    userId: string;
    token: string;
    family: string;
    expiresAt: Date;
  }): Promise<IRefreshToken>;
  findByToken(token: string): Promise<IRefreshToken | null>;
  revokeByFamily(family: string): Promise<void>;
  revokeToken(id: string): Promise<void>;
}

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');
export const REFRESH_TOKEN_REPOSITORY = Symbol('REFRESH_TOKEN_REPOSITORY');
