import { Injectable } from '@nestjs/common';
import { Role } from '@platform/database';
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
        passwordHash: data.passwordHash,
        role: data.role ?? Role.STUDENT,
        profile: {
          create: {
            firstName: data.firstName,
            lastName: data.lastName,
            displayName: data.displayName ?? `${data.firstName} ${data.lastName}`,
          },
        },
        student: data.role === Role.STUDENT || data.role === undefined ? { create: {} } : undefined,
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

  async markPasswordResetTokenUsed(id: string): Promise<void> {
    await this.prisma.passwordResetToken.update({
      where: { id },
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
