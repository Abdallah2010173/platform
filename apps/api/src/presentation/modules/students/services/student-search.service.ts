import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database/prisma.service';
import { StudentHelper, AuthenticatedUser } from '../student.helper';

@Injectable()
export class StudentSearchService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly studentHelper: StudentHelper,
  ) {}

  async searchAll(
    user: AuthenticatedUser,
    query: string,
    types?: string[],
  ): Promise<Record<string, any>> {
    await this.studentHelper.getStudentId(user);

    const q = query?.trim();
    if (!q) {
      return { courses: [], teachers: [], lessons: [], resources: [], students: [] };
    }

    const allowedTypes =
      types && types.length > 0 ? types : ['courses', 'teachers', 'lessons', 'resources'];

    const results: Record<string, any[]> = {};

    if (allowedTypes.includes('courses')) {
      results.courses = await this.prisma.course.findMany({
        where: {
          deletedAt: null,
          isPublished: true,
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { subtitle: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
            { tags: { has: q } },
          ],
        },
        select: {
          id: true,
          title: true,
          slug: true,
          thumbnailUrl: true,
          level: true,
          price: true,
          isFree: true,
          averageRating: true,
          ratingCount: true,
        },
        take: 10,
      });
    }

    if (allowedTypes.includes('teachers')) {
      results.teachers = await this.prisma.teacher.findMany({
        where: {
          deletedAt: null,
          OR: [
            { user: { profile: { firstName: { contains: q, mode: 'insensitive' } } } },
            { user: { profile: { lastName: { contains: q, mode: 'insensitive' } } } },
            { department: { contains: q, mode: 'insensitive' } },
            { expertise: { has: q } },
          ],
        },
        include: {
          user: { include: { profile: true } },
        },
        take: 10,
      });
    }

    if (allowedTypes.includes('lessons')) {
      results.lessons = await this.prisma.lesson.findMany({
        where: {
          deletedAt: null,
          isPublished: true,
          title: { contains: q, mode: 'insensitive' },
        },
        include: {
          chapter: {
            select: { id: true, title: true, course: { select: { id: true, title: true } } },
          },
        },
        take: 10,
      });
    }

    if (allowedTypes.includes('resources')) {
      results.resources = await this.prisma.courseResource.findMany({
        where: {
          deletedAt: null,
          isPublished: true,
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
          ],
        },
        include: { course: { select: { id: true, title: true } } },
        take: 10,
      });
    }

    if (allowedTypes.includes('students')) {
      results.students = await this.prisma.student.findMany({
        where: {
          deletedAt: null,
          OR: [
            { user: { profile: { firstName: { contains: q, mode: 'insensitive' } } } },
            { user: { profile: { lastName: { contains: q, mode: 'insensitive' } } } },
            { user: { email: { contains: q, mode: 'insensitive' } } },
            { studentNumber: { contains: q, mode: 'insensitive' } },
          ],
        },
        include: { user: { include: { profile: true } } },
        take: 10,
      });
    }

    return results;
  }

  async listTeachers(user: AuthenticatedUser, search?: string) {
    await this.studentHelper.getStudentId(user);
    return this.prisma.teacher.findMany({
      where: {
        deletedAt: null,
        user: search
          ? {
              OR: [
                { email: { contains: search, mode: 'insensitive' } },
                { profile: { firstName: { contains: search, mode: 'insensitive' } } },
                { profile: { lastName: { contains: search, mode: 'insensitive' } } },
              ],
            }
          : undefined,
      },
      select: { id: true, user: { select: { id: true, email: true, profile: true } } },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  async searchCourses(
    user: AuthenticatedUser,
    query: string,
    page = 1,
    limit = 12,
  ): Promise<Record<string, any>> {
    await this.studentHelper.getStudentId(user);
    const q = query?.trim();
    const skip = (page - 1) * limit;

    const where = {
      deletedAt: null,
      isPublished: true,
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: 'insensitive' as const } },
              { subtitle: { contains: q, mode: 'insensitive' as const } },
              { description: { contains: q, mode: 'insensitive' as const } },
              { tags: { has: q } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.course.findMany({
        where,
        include: {
          category: { select: { name: true } },
          teachers: {
            include: { teacher: { include: { user: { include: { profile: true } } } } },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.course.count({ where }),
    ]);

    return {
      items: items.map((c) => ({
        id: c.id,
        title: c.title,
        slug: c.slug,
        subtitle: c.subtitle,
        thumbnailUrl: c.thumbnailUrl,
        level: c.level,
        price: c.price ? Number(c.price) : null,
        isFree: c.isFree,
        averageRating: Number(c.averageRating),
        ratingCount: c.ratingCount,
        category: c.category?.name,
        teachers: c.teachers.map((ct) => ({
          name: ct.teacher.user.profile
            ? `${ct.teacher.user.profile.firstName} ${ct.teacher.user.profile.lastName}`
            : ct.teacher.user.email,
        })),
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
