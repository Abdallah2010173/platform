import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../infrastructure/database/prisma.service';
import { slugify } from '../../../../common/utils/slugify';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
  CreateSubCategoryDto,
  UpdateSubCategoryDto,
  CreateSubjectDto,
  UpdateSubjectDto,
} from '../dto/courses.dto';
import { PaginatedResult } from '../../../common/dto/pagination.dto';

@Injectable()
export class CategoryService {
  constructor(private readonly prisma: PrismaService) {}

  // ───────────────────────────────────────────────────────────────────────────
  // Categories
  // ───────────────────────────────────────────────────────────────────────────

  async findAllCategories(query: {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    status?: string;
  }): Promise<PaginatedResult<any>> {
    const {
      page = 1,
      limit = 20,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      status,
    } = query;

    const where: Prisma.CategoryWhereInput = { deletedAt: null };
    if (status && status !== 'ALL') {
      where.status = status as any;
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ];
    }

    const orderBy: Prisma.CategoryOrderByWithRelationInput[] = [{ [sortBy]: sortOrder }];
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.category.findMany({
        where,
        include: { _count: { select: { courses: true, subCategories: true, subjects: true } } },
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.category.count({ where }),
    ]);

    return {
      items: items.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description,
        icon: c.icon,
        color: c.color,
        sortOrder: c.sortOrder,
        status: c.status,
        visibility: c.visibility,
        isFeatured: c.isFeatured,
        isActive: c.isActive,
        thumbnailUrl: c.thumbnailUrl,
        bannerImage: c.bannerImage,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
        courseCount: c._count.courses,
        subCategoryCount: c._count.subCategories,
        subjectCount: c._count.subjects,
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

  async findAllCategoryTree() {
    const categories = await this.prisma.category.findMany({
      where: { deletedAt: null, status: { not: 'ARCHIVED' } },
      include: {
        subCategories: {
          where: { deletedAt: null },
          include: {
            subjects: { where: { deletedAt: null } },
          },
          orderBy: { sortOrder: 'asc' },
        },
        subjects: { where: { deletedAt: null } },
        _count: { select: { courses: true } },
      },
      orderBy: { sortOrder: 'asc' },
    });

    return categories.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description,
      icon: c.icon,
      color: c.color,
      isFeatured: c.isFeatured,
      courseCount: c._count.courses,
      subCategories: c.subCategories.map((s) => ({
        id: s.id,
        name: s.name,
        slug: s.slug,
        color: s.color,
        subjects: s.subjects.map((sub) => ({
          id: sub.id,
          name: sub.name,
          code: sub.code,
          slug: sub.slug,
        })),
      })),
      subjects: c.subjects.map((sub) => ({
        id: sub.id,
        name: sub.name,
        code: sub.code,
        slug: sub.slug,
      })),
    }));
  }

  async findCategoryById(id: string) {
    const category = await this.prisma.category.findFirst({
      where: { id, deletedAt: null },
      include: {
        subCategories: { where: { deletedAt: null }, orderBy: { sortOrder: 'asc' } },
        subjects: { where: { deletedAt: null }, orderBy: { sortOrder: 'asc' } },
        _count: { select: { courses: true } },
      },
    });
    if (!category) throw new NotFoundException('Category not found');

    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      icon: category.icon,
      bannerImage: category.bannerImage,
      thumbnailUrl: category.thumbnailUrl,
      color: category.color,
      sortOrder: category.sortOrder,
      status: category.status,
      visibility: category.visibility,
      isFeatured: category.isFeatured,
      isActive: category.isActive,
      seoTitle: category.seoTitle,
      seoDescription: category.seoDescription,
      seoKeywords: category.seoKeywords,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
      courseCount: category._count.courses,
      subCategories: category.subCategories,
      subjects: category.subjects,
    };
  }

  async createCategory(dto: CreateCategoryDto, userId?: string) {
    const slug = dto.slug || slugify(dto.name);

    const existingSlug = await this.prisma.category.findUnique({ where: { slug } });
    if (existingSlug) throw new ConflictException('Category slug already exists');

    const category = await this.prisma.category.create({
      data: {
        name: dto.name,
        slug,
        description: dto.description,
        icon: dto.icon,
        bannerImage: dto.bannerImage,
        thumbnailUrl: dto.thumbnailUrl,
        color: dto.color,
        sortOrder: dto.sortOrder ?? 0,
        status: dto.status ?? 'ACTIVE',
        visibility: dto.visibility ?? 'PUBLIC',
        isFeatured: dto.isFeatured ?? false,
        isActive: dto.isActive ?? true,
        seoTitle: dto.seoTitle,
        seoDescription: dto.seoDescription,
        seoKeywords: dto.seoKeywords ?? [],
        createdBy: userId,
      },
    });

    return this.findCategoryById(category.id);
  }

  async updateCategory(id: string, dto: UpdateCategoryDto, userId?: string) {
    await this.findCategoryById(id);

    let slug: string | undefined;
    if (dto.slug || dto.name) {
      const candidate = dto.slug || slugify(dto.name!);
      const dup = await this.prisma.category.findFirst({
        where: { slug: candidate, id: { not: id }, deletedAt: null },
      });
      if (dup) throw new ConflictException('Category slug already exists');
      slug = candidate;
    }

    const category = await this.prisma.category.update({
      where: { id },
      data: {
        name: dto.name,
        slug: slug,
        description: dto.description,
        icon: dto.icon,
        bannerImage: dto.bannerImage,
        thumbnailUrl: dto.thumbnailUrl,
        color: dto.color,
        sortOrder: dto.sortOrder,
        status: dto.status,
        visibility: dto.visibility,
        isFeatured: dto.isFeatured,
        isActive: dto.isActive,
        seoTitle: dto.seoTitle,
        seoDescription: dto.seoDescription,
        seoKeywords: dto.seoKeywords,
        updatedBy: userId,
      },
    });

    return this.findCategoryById(category.id);
  }

  async deleteCategory(id: string) {
    await this.findCategoryById(id);
    await this.prisma.category.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false, status: 'ARCHIVED' },
    });
    return { success: true };
  }

  async restoreCategory(id: string) {
    await this.prisma.category.update({
      where: { id },
      data: { deletedAt: null, isActive: true, status: 'ACTIVE' },
    });
    return this.findCategoryById(id);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Sub-categories
  // ───────────────────────────────────────────────────────────────────────────

  async findAllSubCategories(query: {
    page?: number;
    limit?: number;
    search?: string;
    categoryId?: string;
    status?: string;
  }) {
    const { page = 1, limit = 20, search, categoryId, status } = query;

    const where: Prisma.SubCategoryWhereInput = { deletedAt: null };
    if (categoryId) where.categoryId = categoryId;
    if (status && status !== 'ALL') where.status = status as any;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.subCategory.findMany({
        where,
        include: {
          category: { select: { id: true, name: true } },
          _count: { select: { courses: true } },
        },
        orderBy: { sortOrder: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.subCategory.count({ where }),
    ]);

    return {
      items: items.map((s) => ({
        id: s.id,
        categoryId: s.categoryId,
        categoryName: s.category.name,
        name: s.name,
        slug: s.slug,
        description: s.description,
        icon: s.icon,
        color: s.color,
        sortOrder: s.sortOrder,
        status: s.status,
        visibility: s.visibility,
        isFeatured: s.isFeatured,
        isActive: s.isActive,
        createdAt: s.createdAt,
        courseCount: s._count.courses,
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

  async findSubCategoryById(id: string) {
    const sub = await this.prisma.subCategory.findFirst({
      where: { id, deletedAt: null },
      include: { category: true, _count: { select: { courses: true } } },
    });
    if (!sub) throw new NotFoundException('Sub-category not found');
    return { ...sub, categoryName: sub.category.name, courseCount: sub._count.courses };
  }

  async createSubCategory(dto: CreateSubCategoryDto) {
    const category = await this.prisma.category.findFirst({
      where: { id: dto.categoryId, deletedAt: null },
    });
    if (!category) throw new NotFoundException('Parent category not found');

    const slug = dto.slug || slugify(`${category.slug}-${dto.name}`);
    const dup = await this.prisma.subCategory.findUnique({ where: { slug } });
    if (dup) throw new ConflictException('Sub-category slug already exists');

    const sub = await this.prisma.subCategory.create({
      data: {
        categoryId: dto.categoryId,
        name: dto.name,
        slug,
        description: dto.description,
        icon: dto.icon,
        color: dto.color,
        sortOrder: dto.sortOrder ?? 0,
        status: dto.status ?? 'ACTIVE',
        visibility: dto.visibility ?? 'PUBLIC',
        isFeatured: dto.isFeatured ?? false,
      },
    });
    return this.findSubCategoryById(sub.id);
  }

  async updateSubCategory(id: string, dto: UpdateSubCategoryDto) {
    await this.findSubCategoryById(id);

    const data: Prisma.SubCategoryUpdateInput = {
      name: dto.name,
      description: dto.description,
      icon: dto.icon,
      color: dto.color,
      sortOrder: dto.sortOrder,
      status: dto.status,
      visibility: dto.visibility,
      isFeatured: dto.isFeatured,
    };

    if (dto.categoryId) {
      const category = await this.prisma.category.findFirst({
        where: { id: dto.categoryId, deletedAt: null },
      });
      if (!category) throw new NotFoundException('Parent category not found');
      data.category = { connect: { id: dto.categoryId } };
    }

    if (dto.slug || dto.name) {
      const categorySlug = (await this.findSubCategoryById(id)).category.slug;
      const candidate = dto.slug || slugify(`${categorySlug}-${dto.name}`);
      const dup = await this.prisma.subCategory.findFirst({
        where: { slug: candidate, id: { not: id }, deletedAt: null },
      });
      if (dup) throw new ConflictException('Sub-category slug already exists');
      data.slug = candidate;
    }

    const sub = await this.prisma.subCategory.update({ where: { id }, data });
    return this.findSubCategoryById(sub.id);
  }

  async deleteSubCategory(id: string) {
    await this.findSubCategoryById(id);
    await this.prisma.subCategory.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false, status: 'ARCHIVED' },
    });
    return { success: true };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Subjects
  // ───────────────────────────────────────────────────────────────────────────

  async findAllSubjects(query: {
    page?: number;
    limit?: number;
    search?: string;
    categoryId?: string;
    subCategoryId?: string;
    status?: string;
  }) {
    const { page = 1, limit = 20, search, categoryId, subCategoryId, status } = query;

    const where: Prisma.SubjectWhereInput = { deletedAt: null };
    if (categoryId) where.categoryId = categoryId;
    if (subCategoryId) where.subCategoryId = subCategoryId;
    if (status && status !== 'ALL') where.status = status as any;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.subject.findMany({
        where,
        include: {
          category: { select: { id: true, name: true } },
          subCategory: { select: { id: true, name: true } },
          _count: { select: { courses: true } },
        },
        orderBy: { sortOrder: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.subject.count({ where }),
    ]);

    return {
      items: items.map((s) => ({
        id: s.id,
        categoryId: s.categoryId,
        categoryName: s.category.name,
        subCategoryId: s.subCategoryId,
        subCategoryName: s.subCategory?.name,
        name: s.name,
        code: s.code,
        slug: s.slug,
        description: s.description,
        icon: s.icon,
        color: s.color,
        sortOrder: s.sortOrder,
        status: s.status,
        isFeatured: s.isFeatured,
        isActive: s.isActive,
        createdAt: s.createdAt,
        courseCount: s._count.courses,
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

  async findSubjectById(id: string) {
    const subject = await this.prisma.subject.findFirst({
      where: { id, deletedAt: null },
      include: {
        category: { select: { id: true, name: true } },
        subCategory: { select: { id: true, name: true } },
        _count: { select: { courses: true } },
      },
    });
    if (!subject) throw new NotFoundException('Subject not found');
    return { ...subject, categoryName: subject.category.name };
  }

  async createSubject(dto: CreateSubjectDto) {
    const category = await this.prisma.category.findFirst({
      where: { id: dto.categoryId, deletedAt: null },
    });
    if (!category) throw new NotFoundException('Category not found');

    const slug = dto.slug || slugify(dto.name);
    const dupSlug = await this.prisma.subject.findUnique({ where: { slug } });
    if (dupSlug) throw new ConflictException('Subject slug already exists');

    if (dto.code) {
      const dupCode = await this.prisma.subject.findUnique({ where: { code: dto.code } });
      if (dupCode) throw new ConflictException('Subject code already exists');
    }

    const subject = await this.prisma.subject.create({
      data: {
        categoryId: dto.categoryId,
        subCategoryId: dto.subCategoryId,
        name: dto.name,
        code: dto.code ?? slug.toUpperCase(),
        slug,
        description: dto.description,
        icon: dto.icon,
        color: dto.color,
        sortOrder: dto.sortOrder ?? 0,
        status: dto.status ?? 'ACTIVE',
        isFeatured: dto.isFeatured ?? false,
      },
    });
    return this.findSubjectById(subject.id);
  }

  async updateSubject(id: string, dto: UpdateSubjectDto) {
    await this.findSubjectById(id);

    const data: Prisma.SubjectUpdateInput = {
      name: dto.name,
      description: dto.description,
      icon: dto.icon,
      color: dto.color,
      sortOrder: dto.sortOrder,
      status: dto.status,
      isFeatured: dto.isFeatured,
    };

    if (dto.categoryId) {
      const category = await this.prisma.category.findFirst({
        where: { id: dto.categoryId, deletedAt: null },
      });
      if (!category) throw new NotFoundException('Category not found');
      data.category = { connect: { id: dto.categoryId } };
    }

    if (dto.subCategoryId) {
      const subCat = await this.prisma.subCategory.findFirst({
        where: { id: dto.subCategoryId, deletedAt: null },
      });
      if (!subCat) throw new NotFoundException('Sub-category not found');
      data.subCategory = { connect: { id: dto.subCategoryId } };
    } else if (dto.subCategoryId === null) {
      data.subCategory = { disconnect: true };
    }

    if (dto.slug || dto.name) {
      const candidate = dto.slug || slugify(dto.name!);
      const dup = await this.prisma.subject.findFirst({
        where: { slug: candidate, id: { not: id }, deletedAt: null },
      });
      if (dup) throw new ConflictException('Subject slug already exists');
      data.slug = candidate;
    }

    if (dto.code) {
      const dup = await this.prisma.subject.findFirst({
        where: { code: dto.code, id: { not: id }, deletedAt: null },
      });
      if (dup) throw new ConflictException('Subject code already exists');
      data.code = dto.code;
    }

    const subject = await this.prisma.subject.update({ where: { id }, data });
    return this.findSubjectById(subject.id);
  }

  async deleteSubject(id: string) {
    await this.findSubjectById(id);
    await this.prisma.subject.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false, status: 'ARCHIVED' },
    });
    return { success: true };
  }
}
