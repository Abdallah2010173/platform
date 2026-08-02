import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database/prisma.service';
import { StudentHelper, AuthenticatedUser } from '../student.helper';

@Injectable()
export class StudentFeedbackService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly studentHelper: StudentHelper,
  ) {}

  async rateLesson(
    user: AuthenticatedUser,
    lessonId: string,
    dto: { rating: number; comment?: string; isAnonymous?: boolean },
  ) {
    const studentId = await this.studentHelper.getStudentId(user);

    const lesson = await this.prisma.lesson.findFirst({
      where: { id: lessonId, chapter: { course: { students: { some: { studentId } } } } },
    });
    if (!lesson) {
      throw new NotFoundException('Lesson not found or not accessible');
    }

    if (dto.rating < 1 || dto.rating > 5) {
      throw new NotFoundException('Rating must be between 1 and 5');
    }

    const existing = await this.prisma.lessonFeedback.findUnique({
      where: { lessonId_userId: { lessonId, userId: user.id } },
    });

    if (existing) {
      await this.prisma.lessonFeedback.update({
        where: { id: existing.id },
        data: {
          rating: dto.rating,
          comment: dto.comment,
          isAnonymous: dto.isAnonymous ?? false,
        },
      });
      return { success: true, updated: true };
    }

    await this.prisma.lessonFeedback.create({
      data: {
        lessonId,
        userId: user.id,
        rating: dto.rating,
        comment: dto.comment,
        isAnonymous: dto.isAnonymous ?? false,
      },
    });

    return { success: true, updated: false };
  }

  async rateTeacher(
    user: AuthenticatedUser,
    teacherId: string,
    dto: { rating: number; comment?: string },
  ) {
    await this.studentHelper.getStudentId(user);

    if (dto.rating < 1 || dto.rating > 5) {
      throw new NotFoundException('Rating must be between 1 and 5');
    }

    const existing = await this.prisma.teacherRating.findUnique({
      where: { teacherId_userId: { teacherId, userId: user.id } },
    });

    if (existing) {
      await this.prisma.teacherRating.update({
        where: { id: existing.id },
        data: { rating: dto.rating, comment: dto.comment },
      });
    } else {
      await this.prisma.teacherRating.create({
        data: {
          teacherId,
          userId: user.id,
          rating: dto.rating,
          comment: dto.comment,
        },
      });
    }

    // Recalculate teacher average rating
    const ratings = await this.prisma.teacherRating.aggregate({
      where: { teacherId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await this.prisma.teacher.update({
      where: { id: teacherId },
      data: {
        rating: ratings._avg.rating ?? 0,
        ratingCount: ratings._count.rating,
      },
    });

    return { success: true };
  }

  async rateCourse(
    user: AuthenticatedUser,
    courseId: string,
    dto: { rating: number; comment?: string },
  ) {
    const studentId = await this.studentHelper.getStudentId(user);

    const enrollment = await this.prisma.courseStudent.findUnique({
      where: { courseId_studentId: { courseId, studentId } },
    });
    if (!enrollment) {
      throw new NotFoundException('You are not enrolled in this course');
    }

    if (dto.rating < 1 || dto.rating > 5) {
      throw new NotFoundException('Rating must be between 1 and 5');
    }

    const existing = await this.prisma.courseRating.findUnique({
      where: { courseId_userId: { courseId, userId: user.id } },
    });

    if (existing) {
      await this.prisma.courseRating.update({
        where: { id: existing.id },
        data: { rating: dto.rating, comment: dto.comment },
      });
    } else {
      await this.prisma.courseRating.create({
        data: {
          courseId,
          userId: user.id,
          rating: dto.rating,
          comment: dto.comment,
        },
      });
    }

    const ratings = await this.prisma.courseRating.aggregate({
      where: { courseId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await this.prisma.course.update({
      where: { id: courseId },
      data: {
        averageRating: ratings._avg.rating ?? 0,
        ratingCount: ratings._count.rating,
      },
    });

    return { success: true };
  }

  async reportIssue(
    user: AuthenticatedUser,
    dto: { title: string; description?: string; category?: string; attachments?: any },
  ) {
    await this.prisma.platformFeedback.create({
      data: {
        userId: user.id,
        title: dto.title,
        description: dto.description,
        category: dto.category ?? 'GENERAL',
        attachments: dto.attachments,
      },
    });

    return { success: true };
  }

  async getMeetingFeedbackForm(user: AuthenticatedUser, meetingId: string) {
    const studentId = await this.studentHelper.getStudentId(user);

    const attendance = await this.prisma.meetingAttendance.findFirst({
      where: { meetingId, studentId },
    });
    if (!attendance) {
      throw new NotFoundException('You did not attend this meeting');
    }

    const existing = await this.prisma.meetingFeedback.findUnique({
      where: { meetingId_userId: { meetingId, userId: user.id } },
    });

    return {
      meetingId,
      alreadySubmitted: !!existing,
      feedback: existing
        ? {
            rating: existing.rating,
            comment: existing.comment,
          }
        : null,
    };
  }

  async submitMeetingFeedback(
    user: AuthenticatedUser,
    meetingId: string,
    dto: { rating: number; comment?: string; isAnonymous?: boolean },
  ) {
    const studentId = await this.studentHelper.getStudentId(user);

    const attendance = await this.prisma.meetingAttendance.findFirst({
      where: { meetingId, studentId },
    });
    if (!attendance) {
      throw new NotFoundException('You did not attend this meeting');
    }

    const existing = await this.prisma.meetingFeedback.findUnique({
      where: { meetingId_userId: { meetingId, userId: user.id } },
    });

    if (existing) {
      await this.prisma.meetingFeedback.update({
        where: { id: existing.id },
        data: { rating: dto.rating, comment: dto.comment, isAnonymous: dto.isAnonymous ?? false },
      });
    } else {
      await this.prisma.meetingFeedback.create({
        data: {
          meetingId,
          userId: user.id,
          rating: dto.rating,
          comment: dto.comment,
          isAnonymous: dto.isAnonymous ?? false,
        },
      });
    }

    return { success: true };
  }
}
