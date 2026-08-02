import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../../../infrastructure/database/prisma.service';
import { StudentHelper, AuthenticatedUser } from '../student.helper';

@Injectable()
export class StudentProfileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly studentHelper: StudentHelper,
  ) {}

  async getProfile(user: AuthenticatedUser) {
    const student = await this.studentHelper.getStudentWithUser(user);
    const profile = student.user.profile;

    return {
      id: student.id,
      userId: user.id,
      email: user.email,
      firstName: profile?.firstName ?? '',
      lastName: profile?.lastName ?? '',
      displayName: profile?.displayName,
      avatarUrl: profile?.avatarUrl,
      phone: profile?.phone,
      bio: profile?.bio,
      timezone: profile?.timezone ?? 'UTC',
      locale: profile?.locale ?? 'en',
      gender: profile?.gender,
      dateOfBirth: profile?.dateOfBirth,
      city: profile?.city,
      state: profile?.state,
      country: profile?.country,
      studentNumber: student.studentNumber,
      grade: student.grade,
      school: student.school,
      major: student.major,
      enrollmentDate: student.enrollmentDate,
    };
  }

  async updateProfile(
    user: AuthenticatedUser,
    dto: {
      firstName?: string;
      lastName?: string;
      displayName?: string;
      avatarUrl?: string;
      phone?: string;
      bio?: string;
      timezone?: string;
      locale?: string;
      gender?: string;
      dateOfBirth?: string;
      city?: string;
      state?: string;
      country?: string;
      postalCode?: string;
      grade?: string;
      school?: string;
      major?: string;
    },
  ) {
    const student = await this.studentHelper.getStudentWithUser(user);

    await this.prisma.userProfile.update({
      where: { userId: user.id },
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        displayName: dto.displayName,
        avatarUrl: dto.avatarUrl,
        phone: dto.phone,
        bio: dto.bio,
        timezone: dto.timezone,
        locale: dto.locale,
        gender: dto.gender,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
        city: dto.city,
        state: dto.state,
        country: dto.country,
        postalCode: dto.postalCode,
      },
    });

    await this.prisma.student.update({
      where: { id: student.id },
      data: {
        grade: dto.grade,
        school: dto.school,
        major: dto.major,
      },
    });

    return this.getProfile(user);
  }

  async changePassword(
    user: AuthenticatedUser,
    dto: { currentPassword: string; newPassword: string },
  ) {
    const dbUser = await this.prisma.user.findUnique({ where: { id: user.id } });
    if (!dbUser) {
      throw new NotFoundException('User not found');
    }

    if (!dbUser.passwordHash) {
      throw new ConflictException('Password login is not enabled for this account');
    }

    const valid = await bcrypt.compare(dto.currentPassword, dbUser.passwordHash);
    if (!valid) {
      throw new ConflictException('Current password is incorrect');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 12);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    return { success: true };
  }

  async getDevices(user: AuthenticatedUser) {
    return this.prisma.device.findMany({
      where: { userId: user.id, deletedAt: null },
      orderBy: { lastUsedAt: 'desc' },
    });
  }

  async revokeDevice(user: AuthenticatedUser, deviceId: string) {
    await this.prisma.device.updateMany({
      where: { id: deviceId, userId: user.id },
      data: { deletedAt: new Date() },
    });
    return { success: true };
  }
}
