import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Prisma, CourseStatus } from '@prisma/client';
import { PrismaService } from '../../../../infrastructure/database/prisma.service';
import { slugify } from '../../../../common/utils/slugify';
import {
  CreateCourseDto,
  UpdateCourseDto,
  PublishCourseDto,
  CreateChapterDto,
  UpdateChapterDto,
  ReorderChaptersDto,
  CreateLessonDto,
  UpdateLessonDto,
  CreateLessonVideoDto,
  UpdateLessonVideoDto,
  CreateLessonPdfDto,
  UpdateLessonPdfDto,
  CreateLessonAttachmentDto,
  CreateLessonResourceDto,
  CreateCourseResourceDto,
  UpdateCourseResourceDto,
  CreateCourseReviewDto,
} from '../dto/courses.dto';
import { PaginatedResult } from '../../../common/dto/pagination.dto';

interface AuthUser {
  id: string;
  email: string;
  role: string;
}

@Injectable()
export class CourseService {
  constructor(private readonly prisma: PrismaService) {}

  // ═══════════════════════════════════════════════════════════════════════════
  // COURSES
  // ═══════════════════════════════════════════════════════════════════════════

  async findAll(
    query: {
      page?: number;
      limit?: number;
      search?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
      status?: string;
      categoryId?: string;
      subjectId?: string;
      level?: string;
      isPublished?: string;
      isFeatured?: string;
      price?: 'free' | 'paid';
      teacherId?: string;
    },
    user?: AuthUser,
  ): Promise<PaginatedResult<any>> {
    const {
      page = 1,
      limit = 20,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      status,
      categoryId,
      subjectId,
      level,
      isPublished,
      isFeatured,
      price,
      teacherId,
    } = query;

    // Non-admin/non-teacher users only see published courses
    const isStaff = user && (user.role === 'ADMIN');

    const where: Prisma.CourseWhereInput = { deletedAt: null };

    if (isStaff) {
      if (status && status !== 'ALL') {
        if (status === 'PUBLISHED') {
          where.status = 'PUBLISHED';
          where.isPublished = true;
        } else if (status === 'DRAFT') {
          where.status = { in: ['DRAFT', 'PENDING_REVIEW'] } as any;
        } else {
          where.status = status as CourseStatus;
        }
      }
    } else {
      where.isPublished = true;
      where.status = 'PUBLISHED';
    }

    if (categoryId) where.categoryId = categoryId;
    if (subjectId) where.subjectId = subjectId;
    if (level) where.level = level as any;
    if (isPublished === 'true') where.isPublished = true;
    if (isPublished === 'false') where.isPublished = false;
    if (isFeatured === 'true') where.isFeatured = true;
    if (price === 'free') where.isFree = true;
    if (price === 'paid') where.isFree = false;

    if (teacherId) {
      where.teachers = { some: { teacherId, isPrimary: true } };
    }

    const isTeacher = user && user.role === 'TEACHER';
    if (isTeacher) {
      // Teachers see only courses they own
      where.teachers = { some: { teacher: { userId: user.id } } };
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { subtitle: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { shortDescription: { contains: search, mode: 'insensitive' } },
        { tags: { has: search } },
      ];
    }

    const orderBy: Prisma.CourseOrderByWithRelationInput[] = [{ [sortBy]: sortOrder }];
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.course.findMany({
        where,
        include: {
          category: { select: { id: true, name: true, slug: true } },
          subCategory: { select: { id: true, name: true } },
          subject: { select: { id: true, name: true } },
          teachers: {
            include: { teacher: { include: { user: { include: { profile: true } } } } },
          },
          _count: { select: { chapters: true, students: true, lessons: true, resources: true } },
        },
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.course.count({ where }),
    ]);

    return {
      items: items.map((c) => this.mapCourse(c)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPreviousPage: page > 1,
      },
    };
  }

  async findById(id: string) {
    const course = await this.prisma.course.findFirst({
      where: { id, deletedAt: null },
      include: {
        category: true,
        subCategory: true,
        subject: true,
        creator: { include: { profile: true } },
        teachers: {
          include: { teacher: { include: { user: { include: { profile: true } } } } },
        },
        chapters: {
          where: { deletedAt: null },
          include: {
            lessons: {
              where: { deletedAt: null },
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
        resources: {
          where: { deletedAt: null },
          orderBy: { sortOrder: 'asc' },
        },
        reviews: {
          where: { status: 'APPROVED', deletedAt: null },
          include: { user: { include: { profile: true } } },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        _count: {
          select: { students: true, chapters: true, lessons: true, reviews: true, resources: true },
        },
      },
    });

    if (!course) throw new NotFoundException('Course not found');

    const totalLessons = course.chapters.reduce((sum, ch) => sum + ch.lessons.length, 0);
    const totalDuration = course.chapters.reduce(
      (sum, ch) => sum + ch.lessons.reduce((s2, l) => s2 + (l.durationMinutes ?? 0), 0),
      0,
    );

    return {
      id: course.id,
      title: course.title,
      slug: course.slug,
      subtitle: course.subtitle,
      description: course.description,
      shortDescription: course.shortDescription,
      thumbnailUrl: course.thumbnailUrl,
      coverImage: course.coverImage,
      introVideoUrl: course.introVideoUrl,
      previewVideoUrl: course.previewVideoUrl,
      galleryImages: course.galleryImages,
      language: course.language,
      level: course.level,
      durationMinutes: course.durationMinutes ?? totalDuration,
      price: course.price ? Number(course.price) : null,
      discountPrice: course.discountPrice ? Number(course.discountPrice) : null,
      currency: course.currency,
      isFree: course.isFree,
      status: course.status,
      visibility: course.visibility,
      isPublished: course.isPublished,
      isFeatured: course.isFeatured,
      publishedAt: course.publishedAt,
      totalStudents: course.totalStudents,
      totalLessons: totalLessons || course.totalLessons,
      averageRating: Number(course.averageRating),
      ratingCount: course.ratingCount,
      views: course.views,
      watchTimeMinutes: course.watchTimeMinutes,
      completionRate: course.completionRate ? Number(course.completionRate) : null,
      revenue: Number(course.revenue),
      requirements: course.requirements,
      learningOutcomes: course.learningOutcomes,
      tags: course.tags,
      certificateEnabled: course.certificateEnabled,
      discussionEnabled: course.discussionEnabled,
      commentsEnabled: course.commentsEnabled,
      downloadResources: course.downloadResources,
      category: course.category
        ? { id: course.category.id, name: course.category.name, slug: course.category.slug }
        : null,
      subCategory: course.subCategory
        ? { id: course.subCategory.id, name: course.subCategory.name }
        : null,
      subject: course.subject ? { id: course.subject.id, name: course.subject.name } : null,
      creator: course.creator
        ? {
            id: course.creator.id,
            email: course.creator.email,
            name: course.creator.profile
              ? `${course.creator.profile.firstName} ${course.creator.profile.lastName}`
              : undefined,
          }
        : null,
      teachers: course.teachers.map((t) => ({
        id: t.teacherId,
        role: t.role,
        isPrimary: t.isPrimary,
        name: t.teacher.user.profile
          ? `${t.teacher.user.profile.firstName} ${t.teacher.user.profile.lastName}`
          : t.teacher.user.email,
        avatarUrl: t.teacher.user.profile?.avatarUrl,
        bio: t.teacher.bio,
        title: t.teacher.title,
        rating: Number(t.teacher.rating),
      })),
      chapters: course.chapters.map((ch) => ({
        id: ch.id,
        title: ch.title,
        slug: ch.slug,
        description: ch.description,
        chapterNumber: ch.chapterNumber,
        sortOrder: ch.sortOrder,
        estimatedDuration: ch.estimatedDuration,
        status: ch.status,
        isPreview: ch.isPreview,
        isLocked: ch.isLocked,
        lessons: ch.lessons.map((l) => ({
          id: l.id,
          title: l.title,
          slug: l.slug,
          type: l.type,
          lessonNumber: l.lessonNumber,
          orderIndex: l.orderIndex,
          durationMinutes: l.durationMinutes,
          status: l.status,
          isFree: l.isFree,
          isPreview: l.isPreview,
          isPublished: l.isPublished,
          hasVideo: l.videos.length > 0,
          hasPdf: l.pdfs.length > 0,
          hasAttachments: l.attachments.length > 0,
          hasResources: l.resources.length > 0,
        })),
      })),
      resources: course.resources.map((r) => ({
        id: r.id,
        title: r.title,
        description: r.description,
        type: r.type,
        category: r.category,
        url: r.url,
        fileUrl: r.fileUrl,
        fileName: r.fileName,
        fileSize: r.fileSize ? Number(r.fileSize) : null,
        mimeType: r.mimeType,
        isExternal: r.isExternal,
        isPublished: r.isPublished,
        downloadCount: r.downloadCount,
        createdAt: r.createdAt,
      })),
      reviews: course.reviews,
      counts: {
        students: course._count.students,
        chapters: course._count.chapters,
        lessons: course._count.lessons,
        reviews: course._count.reviews,
        resources: course._count.resources,
      },
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
      approvedAt: course.approvedAt,
      rejectionReason: course.rejectionReason,
    };
  }

  async findBySlug(slug: string) {
    const course = await this.prisma.course.findFirst({
      where: { slug, deletedAt: null, isPublished: true },
      select: { id: true },
    });
    if (!course) throw new NotFoundException('Course not found');
    return this.findById(course.id);
  }

  async create(dto: CreateCourseDto, user: AuthUser) {
    const slug = dto.slug ? dto.slug : await this.uniqueSlugify(dto.title);

    // Determine if admin/teacher creates directly published draft vs published
    const isAdmin = user.role === 'ADMIN';

    const course = await this.prisma.course.create({
      data: {
        categoryId: dto.categoryId,
        subCategoryId: dto.subCategoryId,
        subjectId: dto.subjectId,
        title: dto.title,
        slug,
        subtitle: dto.subtitle,
        description: dto.description,
        shortDescription: dto.shortDescription,
        thumbnailUrl: dto.thumbnailUrl,
        coverImage: dto.coverImage,
        introVideoUrl: dto.introVideoUrl,
        previewVideoUrl: dto.previewVideoUrl,
        galleryImages: dto.galleryImages as Prisma.InputJsonValue | undefined,
        language: dto.language ?? 'en',
        level: dto.level ?? 'ALL_LEVELS',
        durationMinutes: dto.durationMinutes,
        price: dto.price,
        discountPrice: dto.discountPrice,
        currency: dto.currency ?? 'USD',
        isFree: dto.isFree ?? false,
        status: isAdmin ? (dto.status ?? 'DRAFT') : 'PENDING_REVIEW',
        visibility: dto.visibility ?? 'PUBLIC',
        isPublished: isAdmin ? (dto.isPublished ?? false) : false,
        isFeatured: dto.isFeatured ?? false,
        requirements: dto.requirements as Prisma.InputJsonValue | undefined,
        learningOutcomes: dto.learningOutcomes as Prisma.InputJsonValue | undefined,
        tags: dto.tags ?? [],
        certificateEnabled: dto.certificateEnabled ?? true,
        discussionEnabled: dto.discussionEnabled ?? true,
        commentsEnabled: dto.commentsEnabled ?? true,
        downloadResources: dto.downloadResources ?? true,
        createdBy: user.id,
      },
    });

    // Connect teacher as owner
    if (user.role === 'TEACHER') {
      const teacher = await this.prisma.teacher.findUnique({ where: { userId: user.id } });
      if (teacher) {
        await this.prisma.courseTeacher.create({
          data: { courseId: course.id, teacherId: teacher.id, role: 'OWNER', isPrimary: true },
        });
      }
    }

    // Create analytics row
    await this.prisma.courseAnalytics.create({
      data: { courseId: course.id },
    });

    return this.findById(course.id);
  }

  async update(id: string, dto: UpdateCourseDto, user?: AuthUser) {
    await this.assertAccess(id, user);

    let slug: string | undefined;
    if (dto.title) {
      slug = await this.uniqueSlugify(dto.title, id);
    }

    const course = await this.prisma.course.update({
      where: { id },
      data: {
        categoryId: dto.categoryId,
        subCategoryId: dto.subCategoryId,
        subjectId: dto.subjectId,
        title: dto.title,
        slug: slug,
        subtitle: dto.subtitle,
        description: dto.description,
        shortDescription: dto.shortDescription,
        thumbnailUrl: dto.thumbnailUrl,
        coverImage: dto.coverImage,
        introVideoUrl: dto.introVideoUrl,
        previewVideoUrl: dto.previewVideoUrl,
        galleryImages: dto.galleryImages as Prisma.InputJsonValue | undefined,
        language: dto.language,
        level: dto.level,
        durationMinutes: dto.durationMinutes,
        price: dto.price,
        discountPrice: dto.discountPrice,
        currency: dto.currency,
        isFree: dto.isFree,
        status: dto.status,
        visibility: dto.visibility,
        isPublished: dto.isPublished,
        isFeatured: dto.isFeatured,
        requirements: dto.requirements as Prisma.InputJsonValue | undefined,
        learningOutcomes: dto.learningOutcomes as Prisma.InputJsonValue | undefined,
        tags: dto.tags,
        certificateEnabled: dto.certificateEnabled,
        discussionEnabled: dto.discussionEnabled,
        commentsEnabled: dto.commentsEnabled,
        downloadResources: dto.downloadResources,
      },
    });

    return this.findById(course.id);
  }

  async updateStatus(id: string, dto: PublishCourseDto, user: AuthUser) {
    await this.assertAccess(id, user);

    const now = new Date();
    const data: Prisma.CourseUpdateInput = { status: dto.status as CourseStatus };

    if (dto.status === 'PUBLISHED') {
      data.isPublished = true;
      data.publishedAt = now;
      data.lastPublishedAt = now;
      data.approvedAt = now;
      data.approver = { connect: { id: user.id } };
    } else if (dto.status === 'APPROVED') {
      data.approvedAt = now;
      data.approver = { connect: { id: user.id } };
    } else if (dto.status === 'REJECTED') {
      data.rejectedAt = now;
      data.rejecter = { connect: { id: user.id } };
      data.rejectionReason = dto.note ?? 'Course rejected';
    } else if (dto.status === 'ARCHIVED') {
      data.isPublished = false;
    } else if (dto.status === 'DRAFT') {
      data.isPublished = false;
    }

    await this.prisma.course.update({ where: { id }, data });

    // Update analytics
    await this.prisma.courseAnalytics.upsert({
      where: { courseId: id },
      create: { courseId: id },
      update: {},
    });

    return this.findById(id);
  }

  async delete(id: string, user?: AuthUser) {
    await this.assertAccess(id, user);
    await this.prisma.course.update({
      where: { id },
      data: { deletedAt: new Date(), isPublished: false, status: 'ARCHIVED' },
    });
    return { success: true };
  }

  async restore(id: string) {
    const course = await this.prisma.course.findUnique({ where: { id } });
    if (!course) throw new NotFoundException('Course not found');
    await this.prisma.course.update({
      where: { id },
      data: { deletedAt: null, status: 'DRAFT' },
    });
    return this.findById(id);
  }

  async duplicate(id: string, user: AuthUser) {
    const source = await this.prisma.course.findFirst({ where: { id, deletedAt: null } });
    if (!source) throw new NotFoundException('Course not found');

    const newSlug = await this.uniqueSlugify(`${source.title} (Copy)`);

    const course = await this.prisma.course.create({
      data: {
        categoryId: source.categoryId,
        subCategoryId: source.subCategoryId,
        subjectId: source.subjectId,
        title: `${source.title} (Copy)`,
        slug: newSlug,
        subtitle: source.subtitle,
        description: source.description,
        shortDescription: source.shortDescription,
        thumbnailUrl: source.thumbnailUrl,
        coverImage: source.coverImage,
        introVideoUrl: source.introVideoUrl,
        previewVideoUrl: source.previewVideoUrl,
        galleryImages: source.galleryImages as Prisma.InputJsonValue | undefined,
        language: source.language,
        level: source.level,
        durationMinutes: source.durationMinutes,
        price: source.price,
        discountPrice: source.discountPrice,
        currency: source.currency,
        isFree: source.isFree,
        status: CourseStatus.DRAFT,
        visibility: source.visibility,
        isPublished: false,
        requirements: source.requirements as Prisma.InputJsonValue | undefined,
        learningOutcomes: source.learningOutcomes as Prisma.InputJsonValue | undefined,
        tags: source.tags,
        certificateEnabled: source.certificateEnabled,
        discussionEnabled: source.discussionEnabled,
        commentsEnabled: source.commentsEnabled,
        downloadResources: source.downloadResources,
        originalCourseId: source.id,
        createdBy: user.id,
      },
    });

    await this.prisma.courseAnalytics.create({ data: { courseId: course.id } });

    // Copy chapters & lessons
    const chapters = await this.prisma.courseChapter.findMany({
      where: { courseId: id, deletedAt: null },
      include: {
        lessons: {
          where: { deletedAt: null },
          include: { videos: true, pdfs: true, attachments: true, resources: true },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });
    for (const ch of chapters) {
      const newChapter = await this.prisma.courseChapter.create({
        data: {
          courseId: course.id,
          title: ch.title,
          slug: `${newSlug}-${slugify(ch.title)}`,
          description: ch.description,
          chapterNumber: ch.chapterNumber,
          sortOrder: ch.sortOrder,
          estimatedDuration: ch.estimatedDuration,
          status: ch.status,
        },
      });
      for (const l of ch.lessons) {
        await this.prisma.lesson.create({
          data: {
            chapterId: newChapter.id,
            courseId: course.id,
            title: l.title,
            slug: `${newSlug}-${slugify(l.title)}`,
            description: l.description,
            content: l.content as Prisma.InputJsonValue | undefined,
            type: l.type,
            lessonNumber: l.lessonNumber,
            orderIndex: l.orderIndex,
            durationMinutes: l.durationMinutes,
            status: l.status,
          },
        });
      }
    }

    return this.findById(course.id);
  }

  async getStats() {
    const [
      total,
      published,
      draft,
      pendingReview,
      archived,
      totalStudents,
      totalRevenue,
      featured,
    ] = await Promise.all([
      this.prisma.course.count({ where: { deletedAt: null } }),
      this.prisma.course.count({
        where: { status: 'PUBLISHED', isPublished: true, deletedAt: null },
      }),
      this.prisma.course.count({ where: { status: 'DRAFT', deletedAt: null } }),
      this.prisma.course.count({ where: { status: 'PENDING_REVIEW', deletedAt: null } }),
      this.prisma.course.count({ where: { status: 'ARCHIVED', deletedAt: null } }),
      this.prisma.courseStudent.count({ where: { status: 'ACTIVE' } }),
      this.prisma.course.aggregate({ _sum: { revenue: true } }),
      this.prisma.course.count({ where: { isFeatured: true, deletedAt: null } }),
    ]);

    return {
      total,
      published,
      draft,
      pendingReview,
      archived,
      totalStudents,
      totalRevenue: Number(totalRevenue._sum.revenue ?? 0),
      featured,
    };
  }

  async getFeatured() {
    const courses = await this.prisma.course.findMany({
      where: { isFeatured: true, isPublished: true, deletedAt: null },
      include: {
        category: { select: { name: true } },
        teachers: { include: { teacher: { include: { user: { include: { profile: true } } } } } },
      },
      orderBy: { updatedAt: 'desc' },
      take: 12,
    });
    return courses.map((c) => this.mapCourse(c));
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CHAPTERS
  // ═══════════════════════════════════════════════════════════════════════════

  async addChapter(courseId: string, dto: CreateChapterDto, user: AuthUser) {
    await this.assertAccess(courseId, user);

    const nextOrder = await this.prisma.courseChapter.aggregate({
      where: { courseId, deletedAt: null },
      _max: { sortOrder: true },
    });
    const sortOrder = (nextOrder._max.sortOrder ?? -1) + 1;

    const chapter = await this.prisma.courseChapter.create({
      data: {
        courseId,
        title: dto.title,
        slug: slugify(dto.title),
        description: dto.description,
        summary: dto.summary,
        icon: dto.icon,
        coverImage: dto.coverImage,
        chapterNumber: dto.chapterNumber ?? sortOrder + 1,
        sortOrder: dto.sortOrder ?? sortOrder,
        estimatedDuration: dto.estimatedDuration,
        status: dto.status ?? 'DRAFT',
        isPreview: dto.isPreview ?? false,
        isLocked: dto.isLocked ?? false,
      },
    });
    return this.findChapterById(chapter.id);
  }

  async findChapterById(id: string) {
    const chapter = await this.prisma.courseChapter.findFirst({
      where: { id, deletedAt: null },
      include: {
        course: { select: { id: true, title: true, slug: true } },
        lessons: {
          where: { deletedAt: null },
          include: { videos: true, pdfs: true, attachments: true, resources: true },
          orderBy: { orderIndex: 'asc' },
        },
      },
    });
    if (!chapter) throw new NotFoundException('Chapter not found');
    return {
      id: chapter.id,
      courseId: chapter.courseId,
      courseTitle: chapter.course.title,
      title: chapter.title,
      slug: chapter.slug,
      description: chapter.description,
      summary: chapter.summary,
      icon: chapter.icon,
      coverImage: chapter.coverImage,
      chapterNumber: chapter.chapterNumber,
      sortOrder: chapter.sortOrder,
      estimatedDuration: chapter.estimatedDuration,
      status: chapter.status,
      isPreview: chapter.isPreview,
      isLocked: chapter.isLocked,
      publishedAt: chapter.publishedAt,
      createdAt: chapter.createdAt,
      updatedAt: chapter.updatedAt,
      lessons: chapter.lessons,
    };
  }

  async updateChapter(id: string, dto: UpdateChapterDto, user: AuthUser) {
    const existing = await this.findChapterById(id);
    await this.assertAccess(existing.courseId, user);

    const chapter = await this.prisma.courseChapter.update({
      where: { id },
      data: {
        title: dto.title,
        slug: dto.title ? slugify(dto.title) : undefined,
        description: dto.description,
        summary: dto.summary,
        icon: dto.icon,
        coverImage: dto.coverImage,
        chapterNumber: dto.chapterNumber,
        sortOrder: dto.sortOrder,
        estimatedDuration: dto.estimatedDuration,
        status: dto.status,
        isPreview: dto.isPreview,
        isLocked: dto.isLocked,
      },
    });
    return this.findChapterById(chapter.id);
  }

  async deleteChapter(id: string, user: AuthUser) {
    const existing = await this.findChapterById(id);
    await this.assertAccess(existing.courseId, user);
    await this.prisma.courseChapter.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'ARCHIVED' },
    });
    return { success: true };
  }

  async reorderChapters(courseId: string, dto: ReorderChaptersDto, user: AuthUser) {
    await this.assertAccess(courseId, user);
    const txns = dto.chapterIds.map((id, index) =>
      this.prisma.courseChapter.update({
        where: { id },
        data: { sortOrder: index },
      }),
    );
    await this.prisma.$transaction(txns);
    return { success: true };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // LESSONS
  // ═══════════════════════════════════════════════════════════════════════════

  async addLesson(chapterId: string, dto: CreateLessonDto, user: AuthUser) {
    const chapter = await this.prisma.courseChapter.findFirst({
      where: { id: chapterId, deletedAt: null },
      include: { course: { select: { id: true } } },
    });
    if (!chapter) throw new NotFoundException('Chapter not found');
    await this.assertAccess(chapter.courseId, user);

    const nextOrder = await this.prisma.lesson.aggregate({
      where: { chapterId, deletedAt: null },
      _max: { orderIndex: true },
    });
    const orderIndex = (nextOrder._max.orderIndex ?? -1) + 1;

    const lesson = await this.prisma.lesson.create({
      data: {
        chapterId,
        courseId: chapter.courseId,
        title: dto.title,
        slug: slugify(dto.title),
        description: dto.description,
        content: dto.content as Prisma.InputJsonValue | undefined,
        type: dto.type ?? 'VIDEO',
        lessonNumber: dto.lessonNumber ?? orderIndex + 1,
        orderIndex: dto.orderIndex ?? orderIndex,
        durationMinutes: dto.durationMinutes,
        status: dto.status ?? 'DRAFT',
        isFree: dto.isFree ?? false,
        isPreview: dto.isPreview ?? false,
        isLocked: dto.isLocked ?? false,
        isPublished: dto.isPublished ?? false,
      },
    });
    return this.findLessonById(lesson.id);
  }

  async findLessonById(id: string) {
    const lesson = await this.prisma.lesson.findFirst({
      where: { id, deletedAt: null },
      include: {
        chapter: { select: { id: true, title: true, courseId: true } },
        videos: true,
        pdfs: true,
        attachments: true,
        resources: true,
      },
    });
    if (!lesson) throw new NotFoundException('Lesson not found');
    return {
      id: lesson.id,
      chapterId: lesson.chapterId,
      chapterTitle: lesson.chapter.title,
      courseId: lesson.courseId,
      title: lesson.title,
      slug: lesson.slug,
      description: lesson.description,
      content: lesson.content,
      type: lesson.type,
      lessonNumber: lesson.lessonNumber,
      orderIndex: lesson.orderIndex,
      durationMinutes: lesson.durationMinutes,
      status: lesson.status,
      visibility: lesson.visibility,
      isFree: lesson.isFree,
      isPreview: lesson.isPreview,
      isLocked: lesson.isLocked,
      isPublished: lesson.isPublished,
      publishedAt: lesson.publishedAt,
      createdAt: lesson.createdAt,
      updatedAt: lesson.updatedAt,
      videos: lesson.videos,
      pdfs: lesson.pdfs,
      attachments: lesson.attachments,
      resources: lesson.resources,
    };
  }

  async updateLesson(id: string, dto: UpdateLessonDto, user: AuthUser) {
    const existing = await this.findLessonById(id);
    await this.assertAccess(existing.courseId, user);

    const lesson = await this.prisma.lesson.update({
      where: { id },
      data: {
        title: dto.title,
        slug: dto.title ? slugify(dto.title) : undefined,
        description: dto.description,
        content: dto.content as Prisma.InputJsonValue | undefined,
        type: dto.type,
        lessonNumber: dto.lessonNumber,
        orderIndex: dto.orderIndex,
        durationMinutes: dto.durationMinutes,
        status: dto.status,
        isFree: dto.isFree,
        isPreview: dto.isPreview,
        isLocked: dto.isLocked,
        isPublished: dto.isPublished,
      },
    });
    return this.findLessonById(lesson.id);
  }

  async deleteLesson(id: string, user: AuthUser) {
    const existing = await this.findLessonById(id);
    await this.assertAccess(existing.courseId, user);
    await this.prisma.lesson.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'ARCHIVED', isPublished: false },
    });
    return { success: true };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // LESSON VIDEOS
  // ═══════════════════════════════════════════════════════════════════════════

  async addLessonVideo(lessonId: string, dto: CreateLessonVideoDto, user: AuthUser) {
    const lesson = await this.findLessonById(lessonId);
    await this.assertAccess(lesson.courseId, user);

    await this.prisma.lessonVideo.create({
      data: {
        lessonId,
        title: dto.title,
        description: dto.description,
        url: dto.url,
        source: dto.source ?? 'UPLOAD',
        durationSeconds: dto.durationSeconds,
        thumbnailUrl: dto.thumbnailUrl,
        sizeBytes: dto.sizeBytes ? BigInt(dto.sizeBytes) : undefined,
        resolution: dto.resolution,
        quality: dto.quality ?? 'AUTO',
        captions: dto.captions as Prisma.InputJsonValue | undefined,
        watermarkUrl: dto.watermarkUrl,
        isPreview: dto.isPreview ?? false,
        hasWatermark: dto.hasWatermark ?? false,
      },
    });
    return this.findLessonById(lessonId);
  }

  async updateLessonVideo(videoId: string, dto: UpdateLessonVideoDto, user: AuthUser) {
    const video = await this.prisma.lessonVideo.findUnique({
      where: { id: videoId },
      include: { lesson: true },
    });
    if (!video) throw new NotFoundException('Video not found');
    await this.assertAccess(video.lesson.courseId, user);

    await this.prisma.lessonVideo.update({
      where: { id: videoId },
      data: {
        title: dto.title,
        description: dto.description,
        url: dto.url,
        source: dto.source,
        durationSeconds: dto.durationSeconds,
        thumbnailUrl: dto.thumbnailUrl,
        sizeBytes: dto.sizeBytes ? BigInt(dto.sizeBytes) : undefined,
        resolution: dto.resolution,
        quality: dto.quality,
        captions: dto.captions as Prisma.InputJsonValue | undefined,
        watermarkUrl: dto.watermarkUrl,
        isPreview: dto.isPreview,
        hasWatermark: dto.hasWatermark,
      },
    });
    return this.findLessonById(video.lessonId);
  }

  async deleteLessonVideo(videoId: string, user: AuthUser) {
    const video = await this.prisma.lessonVideo.findUnique({
      where: { id: videoId },
      include: { lesson: true },
    });
    if (!video) throw new NotFoundException('Video not found');
    await this.assertAccess(video.lesson.courseId, user);
    await this.prisma.lessonVideo.update({
      where: { id: videoId },
      data: { deletedAt: new Date() },
    });
    return { success: true };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // LESSON PDFs
  // ═══════════════════════════════════════════════════════════════════════════

  async addLessonPdf(lessonId: string, dto: CreateLessonPdfDto, user: AuthUser) {
    const lesson = await this.findLessonById(lessonId);
    await this.assertAccess(lesson.courseId, user);

    await this.prisma.lessonPDF.create({
      data: {
        lessonId,
        title: dto.title,
        url: dto.url,
        pageCount: dto.pageCount,
        sizeBytes: dto.sizeBytes ? BigInt(dto.sizeBytes) : undefined,
        isPreview: dto.isPreview ?? false,
      },
    });
    return this.findLessonById(lessonId);
  }

  async updateLessonPdf(pdfId: string, dto: UpdateLessonPdfDto, user: AuthUser) {
    const pdf = await this.prisma.lessonPDF.findUnique({
      where: { id: pdfId },
      include: { lesson: true },
    });
    if (!pdf) throw new NotFoundException('PDF not found');
    await this.assertAccess(pdf.lesson.courseId, user);

    await this.prisma.lessonPDF.update({
      where: { id: pdfId },
      data: {
        title: dto.title,
        url: dto.url,
        pageCount: dto.pageCount,
        sizeBytes: dto.sizeBytes ? BigInt(dto.sizeBytes) : undefined,
        isPreview: dto.isPreview,
      },
    });
    return this.findLessonById(pdf.lessonId);
  }

  async deleteLessonPdf(pdfId: string, user: AuthUser) {
    const pdf = await this.prisma.lessonPDF.findUnique({
      where: { id: pdfId },
      include: { lesson: true },
    });
    if (!pdf) throw new NotFoundException('PDF not found');
    await this.assertAccess(pdf.lesson.courseId, user);
    await this.prisma.lessonPDF.update({ where: { id: pdfId }, data: { deletedAt: new Date() } });
    return { success: true };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // LESSON ATTACHMENTS
  // ═══════════════════════════════════════════════════════════════════════════

  async addAttachment(lessonId: string, dto: CreateLessonAttachmentDto, user: AuthUser) {
    const lesson = await this.findLessonById(lessonId);
    await this.assertAccess(lesson.courseId, user);

    await this.prisma.lessonAttachment.create({
      data: {
        lessonId,
        title: dto.title,
        fileName: dto.fileName,
        fileUrl: dto.fileUrl,
        mimeType: dto.mimeType,
        sizeBytes: dto.sizeBytes ? BigInt(dto.sizeBytes) : undefined,
        isPreview: dto.isPreview ?? false,
      },
    });
    return this.findLessonById(lessonId);
  }

  async deleteAttachment(attachmentId: string, user: AuthUser) {
    const file = await this.prisma.lessonAttachment.findUnique({
      where: { id: attachmentId },
      include: { lesson: true },
    });
    if (!file) throw new NotFoundException('Attachment not found');
    await this.assertAccess(file.lesson.courseId, user);
    await this.prisma.lessonAttachment.update({
      where: { id: attachmentId },
      data: { deletedAt: new Date() },
    });
    return { success: true };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // LESSON RESOURCES
  // ═══════════════════════════════════════════════════════════════════════════

  async addLessonResource(lessonId: string, dto: CreateLessonResourceDto, user: AuthUser) {
    const lesson = await this.findLessonById(lessonId);
    await this.assertAccess(lesson.courseId, user);

    await this.prisma.lessonResource.create({
      data: {
        lessonId,
        title: dto.title,
        type: dto.type ?? 'LINK',
        url: dto.url,
        description: dto.description,
        content: dto.content,
        isExternal: dto.isExternal ?? true,
      },
    });
    return this.findLessonById(lessonId);
  }

  async deleteLessonResource(resourceId: string, user: AuthUser) {
    const resource = await this.prisma.lessonResource.findUnique({
      where: { id: resourceId },
      include: { lesson: true },
    });
    if (!resource) throw new NotFoundException('Resource not found');
    await this.assertAccess(resource.lesson.courseId, user);
    await this.prisma.lessonResource.update({
      where: { id: resourceId },
      data: { deletedAt: new Date() },
    });
    return { success: true };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // COURSE RESOURCES
  // ═══════════════════════════════════════════════════════════════════════════

  async addCourseResource(courseId: string, dto: CreateCourseResourceDto, user: AuthUser) {
    await this.assertAccess(courseId, user);

    const resource = await this.prisma.courseResource.create({
      data: {
        courseId,
        title: dto.title,
        description: dto.description,
        type: dto.type ?? 'FILE',
        category: (dto.category as any) ?? 'GENERAL',
        url: dto.url,
        fileUrl: dto.fileUrl,
        fileName: dto.fileName,
        fileSize: dto.fileSize ? BigInt(dto.fileSize) : undefined,
        mimeType: dto.mimeType,
        content: dto.content,
        isExternal: dto.isExternal ?? false,
        isPublished: dto.isPublished ?? true,
        sortOrder: dto.sortOrder ?? 0,
        createdBy: user.id,
      },
    });
    return this.findResourceById(resource.id);
  }

  async findResourceById(id: string) {
    const resource = await this.prisma.courseResource.findFirst({
      where: { id, deletedAt: null },
      include: { course: { select: { id: true, title: true } } },
    });
    if (!resource) throw new NotFoundException('Resource not found');
    return {
      ...resource,
      fileSize: resource.fileSize ? Number(resource.fileSize) : null,
    };
  }

  async updateCourseResource(id: string, dto: UpdateCourseResourceDto, user: AuthUser) {
    const resource = await this.prisma.courseResource.findUnique({
      where: { id },
      include: { course: true },
    });
    if (!resource) throw new NotFoundException('Resource not found');
    await this.assertAccess(resource.courseId, user);

    const updated = await this.prisma.courseResource.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        type: dto.type,
        category: dto.category as any,
        url: dto.url,
        fileUrl: dto.fileUrl,
        fileName: dto.fileName,
        fileSize: dto.fileSize ? BigInt(dto.fileSize) : undefined,
        mimeType: dto.mimeType,
        content: dto.content,
        isExternal: dto.isExternal,
        isPublished: dto.isPublished,
        sortOrder: dto.sortOrder,
      },
    });
    return this.findResourceById(updated.id);
  }

  async deleteCourseResource(id: string, user: AuthUser) {
    const resource = await this.prisma.courseResource.findUnique({
      where: { id },
      include: { course: true },
    });
    if (!resource) throw new NotFoundException('Resource not found');
    await this.assertAccess(resource.courseId, user);
    await this.prisma.courseResource.update({ where: { id }, data: { deletedAt: new Date() } });
    return { success: true };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // REVIEWS
  // ═══════════════════════════════════════════════════════════════════════════

  async addReview(courseId: string, dto: CreateCourseReviewDto, user: AuthUser) {
    const course = await this.prisma.course.findFirst({ where: { id: courseId, deletedAt: null } });
    if (!course) throw new NotFoundException('Course not found');

    const existing = await this.prisma.courseReview.findUnique({
      where: { courseId_userId: { courseId, userId: user.id } },
    });
    if (existing) {
      await this.prisma.courseReview.update({
        where: { id: existing.id },
        data: {
          rating: dto.rating,
          title: dto.title,
          comment: dto.comment,
          isAnonymous: dto.isAnonymous ?? false,
        },
      });
    } else {
      await this.prisma.courseReview.create({
        data: {
          courseId,
          userId: user.id,
          rating: dto.rating,
          title: dto.title,
          comment: dto.comment,
          isAnonymous: dto.isAnonymous ?? false,
        },
      });
    }

    // Recalculate average
    const agg = await this.prisma.courseReview.aggregate({
      where: { courseId, status: 'APPROVED', deletedAt: null },
      _avg: { rating: true },
      _count: true,
    });

    await this.prisma.course.update({
      where: { id: courseId },
      data: {
        averageRating: Math.round((agg._avg.rating ?? 0) * 100) / 100,
        ratingCount: agg._count,
      },
    });

    return this.getReviews(courseId);
  }

  async getReviews(
    courseId: string,
    query: { page?: number; limit?: number; status?: string } = {},
  ) {
    const { page = 1, limit = 20, status } = query;
    const where: Prisma.CourseReviewWhereInput = { courseId, deletedAt: null };
    if (status && status !== 'ALL') where.status = status as any;

    const [items, total] = await Promise.all([
      this.prisma.courseReview.findMany({
        where,
        include: { user: { include: { profile: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.courseReview.count({ where }),
    ]);

    return {
      items: items.map((r) => ({
        id: r.id,
        courseId: r.courseId,
        rating: r.rating,
        title: r.title,
        comment: r.comment,
        isAnonymous: r.isAnonymous,
        status: r.status,
        createdAt: r.createdAt,
        user: r.isAnonymous
          ? { name: 'Anonymous' }
          : {
              id: r.user.id,
              name: r.user.profile
                ? `${r.user.profile.firstName} ${r.user.profile.lastName}`
                : r.user.email,
              avatarUrl: r.user.profile?.avatarUrl,
            },
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPreviousPage: page > 1,
      },
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════════════════════════════

  private async assertAccess(courseId: string, user?: AuthUser) {
    const course = await this.prisma.course.findFirst({ where: { id: courseId, deletedAt: null } });
    if (!course) throw new NotFoundException('Course not found');

    if (!user) return;
    if (user.role === 'ADMIN') return;

    if (user.role === 'TEACHER') {
      const teacher = await this.prisma.teacher.findUnique({ where: { userId: user.id } });
      const isTeacher = await this.prisma.courseTeacher.findFirst({
        where: { courseId, teacherId: teacher?.id },
      });
      if (!isTeacher && course.createdBy !== user.id) {
        throw new ForbiddenException('You do not have access to this course');
      }
      return;
    }

    throw new ForbiddenException('You do not have access to this course');
  }

  private async uniqueSlugify(title: string, excludeId?: string): Promise<string> {
    const base = slugify(title);
    let slug = base;
    let suffix = 1;
    while (true) {
      const existing = await this.prisma.course.findFirst({
        where: { slug, ...(excludeId ? { id: { not: excludeId } } : {}), deletedAt: null },
      });
      if (!existing) return slug;
      suffix += 1;
      slug = `${base}-${suffix}`;
    }
  }

  private mapCourse(c: any): Record<string, any> {
    return {
      id: c.id,
      title: c.title,
      slug: c.slug,
      subtitle: c.subtitle,
      description: c.description,
      shortDescription: c.shortDescription,
      thumbnailUrl: c.thumbnailUrl,
      coverImage: c.coverImage,
      introVideoUrl: c.introVideoUrl,
      previewVideoUrl: c.previewVideoUrl,
      language: c.language,
      level: c.level,
      durationMinutes: c.durationMinutes,
      price: c.price ? Number(c.price) : null,
      discountPrice: c.discountPrice ? Number(c.discountPrice) : null,
      currency: c.currency,
      isFree: c.isFree,
      status: c.status,
      visibility: c.visibility,
      isPublished: c.isPublished,
      isFeatured: c.isFeatured,
      publishedAt: c.publishedAt,
      totalStudents: c._count?.students ?? c.totalStudents,
      totalLessons: c._count?.lessons ?? c.totalLessons,
      averageRating: Number(c.averageRating),
      ratingCount: c.ratingCount,
      views: c.views,
      category: c.category ? c.category.name : null,
      categoryId: c.categoryId,
      subjectId: c.subjectId,
      tags: c.tags,
      certificateEnabled: c.certificateEnabled,
      teachers: c.teachers
        ? c.teachers.map((t: any) => ({
            id: t.teacherId,
            name: t.teacher?.user?.profile
              ? `${t.teacher.user.profile.firstName} ${t.teacher.user.profile.lastName}`
              : t.teacher?.user?.email,
            avatarUrl: t.teacher?.user?.profile?.avatarUrl,
            role: t.role,
          }))
        : [],
      chapterCount: c._count?.chapters ?? undefined,
      reviewCount: c._count?.reviews ?? undefined,
      resourceCount: c._count?.resources ?? undefined,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    };
  }
}
