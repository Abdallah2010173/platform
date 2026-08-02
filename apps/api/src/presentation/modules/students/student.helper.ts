import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import type { Student, User, UserProfile } from '@platform/database';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
}

export type StudentWithUser = Student & {
  user: User & { profile: UserProfile | null };
};

/**
 * Resolves the authenticated user's Student record and enforces
 * the "students can only access their own data" ownership rule.
 */
@Injectable()
export class StudentHelper {
  constructor(private readonly prisma: PrismaService) {}

  async getStudentId(user: AuthenticatedUser): Promise<string> {
    if (user.role !== 'STUDENT') {
      throw new ForbiddenException('Only students can access this resource');
    }

    const student = await this.prisma.student.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });

    if (!student) {
      throw new NotFoundException('Student profile not found');
    }

    return student.id;
  }

  async getStudentWithUser(user: AuthenticatedUser): Promise<StudentWithUser> {
    if (user.role !== 'STUDENT') {
      throw new ForbiddenException('Only students can access this resource');
    }

    const student = await this.prisma.student.findUnique({
      where: { userId: user.id },
      include: {
        user: { include: { profile: true } },
      },
    });

    if (!student) {
      throw new NotFoundException('Student profile not found');
    }

    return student;
  }

  /**
   * Builds a where clause that scopes queries to the current student.
   * Optionally merges with a provided filter.
   */
  scopedWhere(studentId: string, extra: Record<string, unknown> = {}): Record<string, unknown> {
    return { studentId, ...extra };
  }
}
