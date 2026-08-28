import { Injectable } from '@nestjs/common';
import { Role, AccountProvider } from '@platform/database';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import {
  IUserRepository,
  IUserWithProfile,
  CreateUserData,
} from '../../domain/repositories/user.repository.interface';

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<IUserWithProfile | null> {
    return this.prisma.user.findUnique({
      where: { id },
      include: { profile: true },
    });
  }

  async findByEmail(email: string): Promise<IUserWithProfile | null> {
    return this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { profile: true },
    });
  }

  async create(data: CreateUserData): Promise<IUserWithProfile> {
    return this.prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        passwordHash: data.passwordHash ?? null,
        role: data.role ?? Role.STUDENT,
        emailVerified:
          data.emailVerified ?? false ? new Date() : undefined,
        profile: {
          create: {
            firstName: data.firstName,
            lastName: data.lastName,
            displayName: data.displayName ?? `${data.firstName} ${data.lastName}`.trim(),
            avatarUrl: data.avatarUrl,
          },
        },
        student: data.role === Role.STUDENT || data.role === undefined ? { create: {} } : undefined,
        accounts: data.googleId
          ? {
              create: {
                provider: AccountProvider.GOOGLE,
                providerAccountId: data.googleId,
              },
            }
          : undefined,
      },
      include: { profile: true },
    });
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { lastLoginAt: new Date() },
    });
  }

  async findByProviderAccountId(
    provider: AccountProvider,
    providerAccountId: string,
  ): Promise<IUserWithProfile | null> {
    const account = await this.prisma.account.findUnique({
      where: { provider_providerAccountId: { provider, providerAccountId } },
      include: { user: { include: { profile: true } } },
    });
    return account?.user ?? null;
  }

  async linkGoogleAccount(userId: string, googleId: string): Promise<{ id: string }> {
    const account = await this.prisma.account.create({
      data: {
        userId,
        provider: AccountProvider.GOOGLE,
        providerAccountId: googleId,
      },
    });
    return { id: account.id };
  }

  async updateGoogleProfile(
    userId: string,
    data: { firstName?: string; lastName?: string; displayName?: string; avatarUrl?: string },
  ): Promise<void> {
    await this.prisma.userProfile.upsert({
      where: { userId },
      create: {
        userId,
        firstName: data.firstName ?? '',
        lastName: data.lastName ?? '',
        displayName: data.displayName ?? `${data.firstName ?? ''} ${data.lastName ?? ''}`.trim(),
        avatarUrl: data.avatarUrl,
      },
      update: {
        ...(data.firstName !== undefined ? { firstName: data.firstName } : {}),
        ...(data.lastName !== undefined ? { lastName: data.lastName } : {}),
        ...(data.displayName !== undefined ? { displayName: data.displayName } : {}),
        ...(data.avatarUrl !== undefined ? { avatarUrl: data.avatarUrl } : {}),
      },
    });
  }

  async createOAuthState(data: {
    userId: string;
    code: string;
    expiresAt: Date;
  }): Promise<{ id: string; code: string; userId: string }> {
    return this.prisma.oAuthState.create({ data });
  }

  async findOAuthStateByCode(code: string) {
    return this.prisma.oAuthState.findUnique({ where: { code } });
  }

  async markOAuthStateUsed(id: string): Promise<void> {
    await this.prisma.oAuthState.update({
      where: { id },
      data: { usedAt: new Date() },
    });
  }

  async createPasswordResetToken(data: {
    userId: string;
    email: string;
    token: string;
    expiresAt: Date;
  }): Promise<void> {
    await this.prisma.passwordResetToken.create({
      data: {
        userId: data.userId,
        email: data.email,
        token: data.token,
        expiresAt: data.expiresAt,
      },
    });
  }

  async findPasswordResetToken(token: string) {
    return this.prisma.passwordResetToken.findUnique({ where: { token } });
  }

  async resetPasswordWithToken(token: string, passwordHash: string): Promise<string | null> {
    return this.prisma.$transaction(async (tx) => {
      const resetToken = await tx.passwordResetToken.findFirst({
        where: { token, usedAt: null, deletedAt: null, expiresAt: { gt: new Date() } },
      });
      if (!resetToken?.userId) return null;

      await tx.user.update({ where: { id: resetToken.userId }, data: { passwordHash } });
      await tx.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      });
      return resetToken.userId;
    });
  }

  async markPasswordResetTokenUsed(id: string): Promise<void> {
    await this.prisma.passwordResetToken.update({
      where: { id },
      data: { usedAt: new Date() },
    });
  }

  async invalidatePasswordResetToken(token: string): Promise<void> {
    await this.prisma.passwordResetToken.updateMany({
      where: { token, usedAt: null },
      data: { usedAt: new Date() },
    });
  }

  async createEmailVerificationToken(data: {
    userId: string;
    token: string;
    expiresAt: Date;
  }): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: data.userId } });
    await this.prisma.emailVerificationToken.create({
      data: {
        userId: data.userId,
        email: user?.email ?? '',
        token: data.token,
        expiresAt: data.expiresAt,
      },
    });
  }

  async findEmailVerificationToken(token: string) {
    return this.prisma.emailVerificationToken.findUnique({ where: { token } });
  }

  async markEmailVerified(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { emailVerified: new Date(), emailVerifiedAt: new Date() },
    });
  }

  async markEmailVerificationTokenUsed(id: string): Promise<void> {
    await this.prisma.emailVerificationToken.update({
      where: { id },
      data: { usedAt: new Date() },
    });
  }

  async consumeEmailVerificationToken(token: string, now: Date): Promise<{ id: string; userId: string } | null> {
    const result = await this.prisma.emailVerificationToken.updateMany({
      where: { token, userId: { not: null }, usedAt: null, expiresAt: { gt: now } },
      data: { usedAt: now },
    });
    if (result.count !== 1) return null;

    const consumed = await this.prisma.emailVerificationToken.findUnique({ where: { token } });
    return consumed?.userId ? { id: consumed.id, userId: consumed.userId } : null;
  }

  async countRecentEmailVerificationTokens(userId: string, since: Date): Promise<number> {
    return this.prisma.emailVerificationToken.count({
      where: { userId, createdAt: { gt: since } },
    });
  }

  async invalidateEmailVerificationTokens(userId: string): Promise<void> {
    await this.prisma.emailVerificationToken.updateMany({
      where: { userId, usedAt: null },
      data: { usedAt: new Date() },
    });
  }

  async updatePassword(userId: string, passwordHash: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
  }

  async findSessions(userId: string) {
    return this.prisma.session.findMany({
      where: { userId, status: 'ACTIVE' },
      orderBy: { lastActiveAt: 'desc' },
    });
  }

  async revokeSession(userId: string, sessionId: string) {
    await this.prisma.session.updateMany({
      where: { id: sessionId, userId },
      data: { status: 'REVOKED' },
    });
    return { success: true };
  }

  async revokeAllSessions(userId: string) {
    await this.prisma.session.updateMany({
      where: { userId, status: 'ACTIVE' },
      data: { status: 'REVOKED' },
    });
    return { success: true };
  }

  async findDevices(userId: string) {
    return this.prisma.device.findMany({
      where: { userId },
      orderBy: { lastUsedAt: 'desc' },
    });
  }

  async revokeDevice(userId: string, deviceId: string) {
    await this.prisma.device.updateMany({
      where: { id: deviceId, userId },
      data: { deletedAt: new Date() },
    });
    await this.prisma.session.updateMany({
      where: { deviceId, userId, status: 'ACTIVE' },
      data: { status: 'REVOKED' },
    });
    return { success: true };
  }
}
