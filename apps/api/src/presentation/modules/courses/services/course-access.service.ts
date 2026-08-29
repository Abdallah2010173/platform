import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database/prisma.service';
import { AccessType, Role } from '@prisma/client';

export type CourseAccessDecision = {
  hasAccess: boolean;
  accessType: AccessType | 'NONE';
  reason?: string;
  enrollmentId?: string;
  courseId?: string;
};

@Injectable()
export class CourseAccessService {
  constructor(private readonly prisma: PrismaService) {}

  async canAccessCourse(userId: string | null | undefined, courseId: string): Promise<CourseAccessDecision> {
    if (!userId) {
      const course = await this.prisma.course.findUnique({
        where: { id: courseId, deletedAt: null },
        select: { id: true, isFree: true, price: true, status: true, isPublished: true },
      });

      if (!course) {
        throw new NotFoundException('Course not found');
      }

      const price = course.price ? Number(course.price) : 0;
      const hasPublicAccess = Boolean(course.isFree || price === 0);
      return {
        hasAccess: hasPublicAccess,
        accessType: hasPublicAccess ? 'FREE' : 'NONE',
        reason: hasPublicAccess ? undefined : 'Paid course requires enrollment or an approved grant.',
      };
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role === Role.ADMIN) {
      return { hasAccess: true, accessType: 'ADMIN_GRANTED' };
    }

    const course = await this.prisma.course.findUnique({
      where: { id: courseId, deletedAt: null },
      select: { id: true, isFree: true, price: true, status: true, isPublished: true, teachers: { where: { deletedAt: null }, select: { teacher: { select: { userId: true } } } } },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    if (user.role === Role.TEACHER) {
      const isTeacher = course.teachers.some((t) => t.teacher.userId === userId);
      if (isTeacher) {
        return { hasAccess: true, accessType: 'TEACHER_GRANTED' };
      }
    }

    const student = await this.prisma.student.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!student) {
      return { hasAccess: false, accessType: 'NONE', reason: 'Student profile is required for course access.' };
    }

    const enrollment = await this.prisma.courseStudent.findUnique({
      where: { courseId_studentId: { courseId, studentId: student.id } },
      select: {
        id: true,
        status: true,
        accessType: true,
        accessGrantedBy: true,
        deletedAt: true,
      },
    });

    if (!enrollment || enrollment.deletedAt) {
      const price = course.price ? Number(course.price) : 0;
      const hasFreeCourseAccess = Boolean(course.isFree || price === 0);
      return {
        hasAccess: hasFreeCourseAccess,
        accessType: hasFreeCourseAccess ? 'FREE' : 'NONE',
        reason: hasFreeCourseAccess ? undefined : 'Enrollment is required to access this course.',
      };
    }

    if (enrollment.status !== 'ACTIVE') {
      return {
        hasAccess: false,
        accessType: enrollment.accessType,
        reason: 'Course access is not active.',
      };
    }

    return {
      hasAccess: true,
      accessType: enrollment.accessType,
      enrollmentId: enrollment.id,
      courseId,
    };
  }

  async canAccessLesson(userId: string | null | undefined, lessonId: string): Promise<CourseAccessDecision & { lessonId: string }> {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId, deletedAt: null },
      select: {
        id: true,
        isFree: true,
        isPreview: true,
        chapter: { select: { courseId: true } },
      },
    });

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    const access = await this.canAccessCourse(userId, lesson.chapter.courseId);
    if (access.hasAccess) {
      return { ...access, lessonId: lesson.id };
    }

    if (lesson.isFree || lesson.isPreview) {
      return { hasAccess: true, accessType: 'FREE', lessonId: lesson.id };
    }

    return { ...access, lessonId: lesson.id, reason: access.reason ?? 'Lesson is not available for this user.' };
  }

  async assertCourseAccess(userId: string | null | undefined, courseId: string): Promise<void> {
    const decision = await this.canAccessCourse(userId, courseId);
    if (!decision.hasAccess) {
      throw new ForbiddenException(decision.reason ?? 'You do not have access to this course');
    }
  }

  async assertLessonAccess(userId: string | null | undefined, lessonId: string): Promise<void> {
    const decision = await this.canAccessLesson(userId, lessonId);
    if (!decision.hasAccess) {
      throw new ForbiddenException(decision.reason ?? 'You do not have access to this lesson');
    }
  }
}
