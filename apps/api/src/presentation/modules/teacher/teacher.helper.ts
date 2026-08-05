import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import type { Teacher, User, UserProfile } from '@platform/database';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
}

export type TeacherWithUser = Teacher & {
  user: User & { profile: UserProfile | null };
};

/**
 * Resolves the authenticated user's Teacher record and enforces
 * the "teachers can only access their own data" ownership rule.
 */
@Injectable()
export class TeacherHelper {
  constructor(private readonly prisma: PrismaService) {}

  async getTeacherId(user: AuthenticatedUser): Promise<string> {
    if (user.role !== 'TEACHER') {
      throw new ForbiddenException('Only teachers can access this resource');
    }

    const teacher = await this.prisma.teacher.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher profile not found');
    }

    return teacher.id;
  }

  async getTeacherWithUser(user: AuthenticatedUser): Promise<TeacherWithUser> {
    if (user.role !== 'TEACHER') {
      throw new ForbiddenException('Only teachers can access this resource');
    }

    const teacher = await this.prisma.teacher.findUnique({
      where: { userId: user.id },
      include: {
        user: { include: { profile: true } },
      },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher profile not found');
    }

    return teacher;
  }

  /**
   * Builds a where clause that scopes queries to the current teacher.
   * Optionally merges with a provided filter.
   */
  scopedWhere(teacherId: string, extra: Record<string, unknown> = {}): Record<string, unknown> {
    return { teacherId, ...extra };
  }
}
