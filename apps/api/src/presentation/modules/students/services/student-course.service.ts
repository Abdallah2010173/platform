import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database/prisma.service';
import { StudentHelper, AuthenticatedUser } from '../student.helper';

@Injectable()
export class StudentCourseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly studentHelper: StudentHelper,
  ) {}

  async getMyCourses(
    user: AuthenticatedUser,
    status?: string,
    search?: string,
  ): Promise<Record<string, any>[]> {
    const studentId = await this.studentHelper.getStudentId(user);

    const statusFilter = status === 'ALL' || !status ? {} : { status: status as any };

    const where = {
      studentId,
      ...statusFilter,
      ...(search ? { course: { title: { contains: search, mode: 'insensitive' as const } } } : {}),
    };

    const enrollments = await this.prisma.courseStudent.findMany({
      where,
      include: {
        course: {
          include: {
            category: true,
            subCategory: true,
            teachers: {
              include: { teacher: { include: { user: { include: { profile: true } } } } },
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return enrollments.map((enrollment) => ({
      id: enrollment.id,
      courseId: enrollment.courseId,
      title: enrollment.course.title,
      slug: enrollment.course.slug,
      thumbnailUrl: enrollment.course.thumbnailUrl,
      description: enrollment.course.description,
      level: enrollment.course.level,
      progress: Number(enrollment.progress),
      status: enrollment.status,
      completedAt: enrollment.completedAt,
      enrolledAt: enrollment.enrolledAt,
      category: enrollment.course.category?.name,
      subCategory: enrollment.course.subCategory?.name,
      teachers: enrollment.course.teachers.map((ct) => ({
        name: ct.teacher.user.profile
          ? `${ct.teacher.user.profile.firstName} ${ct.teacher.user.profile.lastName}`
          : ct.teacher.user.email,
        avatarUrl: ct.teacher.user.profile?.avatarUrl,
      })),
    }));
  }

  async getCourseDetail(user: AuthenticatedUser, courseId: string): Promise<Record<string, any>> {
    const studentId = await this.studentHelper.getStudentId(user);

    const enrollment = await this.prisma.courseStudent.findUnique({
      where: {
        courseId_studentId: { courseId, studentId },
      },
      include: {
        course: {
          include: {
            category: true,
            subCategory: true,
            chapters: {
              include: {
                lessons: {
                  include: {
                    videos: true,
                    pdfs: true,
                    attachments: true,
                    resources: true,
                  },
                  orderBy: { orderIndex: 'asc' },
                },
              },
              orderBy: { sortOrder: 'asc' },
            },
            teachers: {
              include: { teacher: { include: { user: { include: { profile: true } } } } },
            },
          },
        },
      },
    });

    if (!enrollment) {
      throw new NotFoundException('You are not enrolled in this course');
    }

    const course = enrollment.course;
    const totalLessons = course.chapters.reduce((sum, ch) => sum + ch.lessons.length, 0);

    return {
      enrollment: {
        id: enrollment.id,
        progress: Number(enrollment.progress),
        status: enrollment.status,
        completedAt: enrollment.completedAt,
        enrolledAt: enrollment.enrolledAt,
      },
      course: {
        id: course.id,
        title: course.title,
        slug: course.slug,
        description: course.description,
        thumbnailUrl: course.thumbnailUrl,
        level: course.level,
        language: course.language,
        price: course.price ? Number(course.price) : null,
        isFree: course.isFree,
        totalLessons,
        durationMinutes: course.durationMinutes,
        averageRating: Number(course.averageRating),
        ratingCount: course.ratingCount,
        tags: course.tags,
        learningOutcomes: course.learningOutcomes,
        requirements: course.requirements,
        category: course.category?.name,
        subCategory: course.subCategory?.name,
        teachers: course.teachers.map((ct) => ({
          name: ct.teacher.user.profile
            ? `${ct.teacher.user.profile.firstName} ${ct.teacher.user.profile.lastName}`
            : ct.teacher.user.email,
          avatarUrl: ct.teacher.user.profile?.avatarUrl,
          bio: ct.teacher.bio,
        })),
      },
      chapters: course.chapters.map((ch) => ({
        id: ch.id,
        title: ch.title,
        sortOrder: ch.sortOrder,
        lessons: ch.lessons.map((l) => ({
          id: l.id,
          title: l.title,
          type: l.type,
          orderIndex: l.orderIndex,
          durationMinutes: l.durationMinutes,
          isFree: l.isFree,
          isPublished: l.isPublished,
          hasVideo: l.videos.length > 0,
          hasPdf: l.pdfs.length > 0,
          hasAttachments: l.attachments.length > 0,
        })),
      })),
    };
  }

  async getLesson(
    user: AuthenticatedUser,
    courseId: string,
    lessonId: string,
  ): Promise<Record<string, any>> {
    const studentId = await this.studentHelper.getStudentId(user);

    const enrollment = await this.prisma.courseStudent.findUnique({
      where: { courseId_studentId: { courseId, studentId } },
    });
    if (!enrollment) {
      throw new NotFoundException('You are not enrolled in this course');
    }

    const lesson = await this.prisma.lesson.findFirst({
      where: { id: lessonId, chapter: { courseId } },
      include: {
        chapter: true,
        videos: true,
        pdfs: true,
        attachments: true,
        resources: true,
        feedback: true,
      },
    });

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    return {
      id: lesson.id,
      title: lesson.title,
      description: lesson.description,
      type: lesson.type,
      content: lesson.content,
      durationMinutes: lesson.durationMinutes,
      isFree: lesson.isFree,
      videos: lesson.videos.map((v) => ({
        id: v.id,
        title: v.title,
        url: v.url,
        source: v.source,
        durationSeconds: v.durationSeconds,
        thumbnailUrl: v.thumbnailUrl,
      })),
      pdfs: lesson.pdfs.map((p) => ({
        id: p.id,
        title: p.title,
        url: p.url,
        pageCount: p.pageCount,
        isPreview: p.isPreview,
      })),
      attachments: lesson.attachments.map((a) => ({
        id: a.id,
        title: a.title,
        fileName: a.fileName,
        fileUrl: a.fileUrl,
        mimeType: a.mimeType,
      })),
      resources: lesson.resources.map((r) => ({
        id: r.id,
        title: r.title,
        type: r.type,
        url: r.url,
        isExternal: r.isExternal,
      })),
      chapterId: lesson.chapterId,
      chapterTitle: lesson.chapter.title,
    };
  }

  async markLessonComplete(user: AuthenticatedUser, courseId: string, lessonId: string) {
    const studentId = await this.studentHelper.getStudentId(user);

    const enrollment = await this.prisma.courseStudent.findUnique({
      where: { courseId_studentId: { courseId, studentId } },
    });
    if (!enrollment) {
      throw new NotFoundException('You are not enrolled in this course');
    }

    // Verify lesson belongs to course
    const lesson = await this.prisma.lesson.findFirst({
      where: { id: lessonId, chapter: { courseId } },
      select: { id: true },
    });
    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    // Recalculate progress: count published lessons completed vs total
    const totalLessons = await this.prisma.lesson.count({
      where: { chapter: { courseId }, isPublished: true },
    });
    const progress =
      totalLessons > 0
        ? Math.min(Math.round((1 / totalLessons) * 10000) / 100 + Number(enrollment.progress), 100)
        : 0;

    await this.prisma.courseStudent.update({
      where: { courseId_studentId: { courseId, studentId } },
      data: {
        progress,
        ...(progress >= 100 ? { completedAt: new Date(), status: 'COMPLETED' } : {}),
      },
    });

    return { success: true, progress };
  }

  async getFavorites(user: AuthenticatedUser): Promise<Record<string, any>[]> {
    const studentId = await this.studentHelper.getStudentId(user);

    // Favorites are tracked via bookmark-like behavior; for now return courses with progress
    const enrollments = await this.prisma.courseStudent.findMany({
      where: { studentId },
      include: {
        course: { select: { id: true, title: true, slug: true, thumbnailUrl: true, level: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return enrollments.map((e) => ({
      courseId: e.courseId,
      title: e.course.title,
      slug: e.course.slug,
      thumbnailUrl: e.course.thumbnailUrl,
      level: e.course.level,
      progress: Number(e.progress),
    }));
  }
}
