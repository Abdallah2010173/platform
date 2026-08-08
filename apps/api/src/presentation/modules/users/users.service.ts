import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { Prisma, Role } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { CreateUserDto, UpdateUserDto } from './dto/users.dto';
import { PaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    query: {
      page?: number;
      limit?: number;
      search?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
      filterBy?: string;
      filterValue?: string;
      role?: Role;
    } = {},
  ): Promise<PaginatedResult<any>> {
    const {
      page = 1,
      limit = 20,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      filterBy,
      filterValue,
      role,
    } = query;

    const where: Prisma.UserWhereInput = { deletedAt: null };

    if (role) {
      where.role = role;
    }

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { profile: { firstName: { contains: search, mode: 'insensitive' } } },
        { profile: { lastName: { contains: search, mode: 'insensitive' } } },
        { profile: { displayName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (filterBy && filterValue) {
      const allowed = new Set(['role', 'isActive', 'emailVerifiedAt', 'createdAt']);
      if (allowed.has(filterBy)) {
        if (filterBy === 'isActive') {
          where.isActive = filterValue === 'true';
        } else if (filterBy === 'role') {
          where.role = filterValue as Role;
        }
      }
    }

    const orderBy: Prisma.UserOrderByWithRelationInput[] = [];
    const sortable = new Set([
      'createdAt',
      'updatedAt',
      'email',
      'role',
      'lastLoginAt',
      'isActive',
    ]);
    if (sortable.has(sortBy)) {
      orderBy.push({ [sortBy]: sortOrder });
    } else {
      orderBy.push({ createdAt: 'desc' });
    }

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        include: {
          profile: true,
          teacher: true,
          student: true,
          admin: true,
        },
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      items: items.map((u) => this.mapUser(u)),
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
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      include: {
        profile: true,
        teacher: true,
        student: true,
        admin: true,
      },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.mapUser(user);
  }

  async create(dto: CreateUserDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('Email already in use');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        role: dto.role,
        isActive: dto.isActive ?? true,
        profile: {
          create: {
            firstName: dto.firstName ?? '',
            lastName: dto.lastName ?? '',
            displayName: dto.displayName,
            phone: dto.phone,
            bio: dto.bio,
            timezone: dto.timezone ?? 'UTC',
            locale: dto.locale ?? 'en',
            gender: dto.gender,
            city: dto.city,
            state: dto.state,
            country: dto.country,
          },
        },
        ...(dto.role === Role.STUDENT
          ? {
              student: {
                create: {
                  grade: dto.grade,
                  school: dto.school,
                  major: dto.major,
                },
              },
            }
          : {}),
        ...(dto.role === Role.TEACHER
          ? {
              teacher: {
                create: {
                  title: dto.title,
                  department: dto.department,
                  expertise: dto.expertise ?? [],
                  bio: dto.bio,
                },
              },
            }
          : {}),
        ...(dto.role === Role.ADMIN
          ? {
              admin: {
                create: {
                  department: dto.department,
                },
              },
            }
          : {}),
      },
      include: {
        profile: true,
        student: true,
        teacher: true,
        admin: true,
      },
    });

    return this.mapUser(user);
  }

  async update(id: string, dto: UpdateUserDto) {
    const existing = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) {
      throw new NotFoundException('User not found');
    }

    const data: Prisma.UserUpdateInput = {};

    if (dto.email && dto.email !== existing.email) {
      const emailTaken = await this.prisma.user.findUnique({ where: { email: dto.email } });
      if (emailTaken && emailTaken.id !== id) {
        throw new ConflictException('Email already in use');
      }
      data.email = dto.email;
    }

    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    if (dto.role) data.role = dto.role;

    if (
      dto.firstName !== undefined ||
      dto.lastName !== undefined ||
      dto.displayName !== undefined ||
      dto.phone !== undefined ||
      dto.bio !== undefined ||
      dto.timezone !== undefined ||
      dto.locale !== undefined ||
      dto.gender !== undefined ||
      dto.city !== undefined ||
      dto.state !== undefined ||
      dto.country !== undefined
    ) {
      data.profile = {
        update: {
          firstName: dto.firstName,
          lastName: dto.lastName,
          displayName: dto.displayName,
          phone: dto.phone,
          bio: dto.bio,
          timezone: dto.timezone,
          locale: dto.locale,
          gender: dto.gender,
          city: dto.city,
          state: dto.state,
          country: dto.country,
        },
      };
    }

    const user = await this.prisma.user.update({
      where: { id },
      data,
      include: {
        profile: true,
        student: true,
        teacher: true,
        admin: true,
      },
    });

    // Update role-specific record if role changed
    if (dto.role) {
      if (dto.role === Role.STUDENT && !user.student) {
        await this.prisma.student.create({
          data: { userId: id, grade: dto.grade, school: dto.school, major: dto.major },
        });
      }
      if (dto.role === Role.TEACHER && !user.teacher) {
        await this.prisma.teacher.create({
          data: {
            userId: id,
            title: dto.title,
            department: dto.department,
            expertise: dto.expertise ?? [],
          },
        });
      }
      if (dto.role === Role.ADMIN && !user.admin) {
        await this.prisma.admin.create({
          data: { userId: id, department: dto.department },
        });
      }
    }

    return this.findById(id);
  }

  async softDelete(id: string) {
    const user = await this.prisma.user.findFirst({ where: { id, deletedAt: null } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    await this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
    return { success: true };
  }

  async restore(id: string) {
    const user = await this.prisma.user.findFirst({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    await this.prisma.user.update({
      where: { id },
      data: { deletedAt: null, isActive: true },
    });
    return { success: true };
  }

  async hardDelete(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    await this.prisma.user.delete({ where: { id } });
    return { success: true };
  }

  async changePassword(id: string, newPassword: string) {
    const user = await this.prisma.user.findFirst({ where: { id, deletedAt: null } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.prisma.user.update({
      where: { id },
      data: { passwordHash },
    });
    return { success: true };
  }

  async bulkDelete(ids: string[], hard = false) {
    if (!ids?.length) {
      throw new BadRequestException('No user IDs provided');
    }
    const users = await this.prisma.user.findMany({
      where: { id: { in: ids }, deletedAt: null },
    });
    if (users.length === 0) {
      throw new NotFoundException('No active users found for the given IDs');
    }

    if (hard) {
      await this.prisma.user.deleteMany({ where: { id: { in: ids } } });
    } else {
      await this.prisma.user.updateMany({
        where: { id: { in: ids } },
        data: { deletedAt: new Date(), isActive: false },
      });
    }
    return { success: true, count: users.length };
  }

  async bulkRestore(ids: string[]) {
    if (!ids?.length) {
      throw new BadRequestException('No user IDs provided');
    }
    const result = await this.prisma.user.updateMany({
      where: { id: { in: ids } },
      data: { deletedAt: null, isActive: true },
    });
    return { success: true, count: result.count };
  }

  async bulkAction(ids: string[], action: string, extra?: any) {
    switch (action) {
      case 'DELETE':
        return this.bulkDelete(ids);
      case 'HARD_DELETE':
        return this.bulkDelete(ids, true);
      case 'RESTORE':
        return this.bulkRestore(ids);
      case 'ACTIVATE':
        await this.prisma.user.updateMany({
          where: { id: { in: ids } },
          data: { isActive: true, deletedAt: null },
        });
        return { success: true, count: ids.length };
      case 'DEACTIVATE':
        await this.prisma.user.updateMany({
          where: { id: { in: ids } },
          data: { isActive: false },
        });
        return { success: true, count: ids.length };
      case 'CHANGE_ROLE':
        if (!extra?.role) {
          throw new BadRequestException('Role required for CHANGE_ROLE action');
        }
        await this.prisma.user.updateMany({
          where: { id: { in: ids } },
          data: { role: extra.role },
        });
        return { success: true, count: ids.length };
      default:
        throw new BadRequestException(`Unknown bulk action: ${action}`);
    }
  }

  async getStats() {
    const [total, admins, teachers, students, active, inactive, recent] = await Promise.all([
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.user.count({ where: { role: Role.ADMIN, deletedAt: null } }),
      this.prisma.user.count({ where: { role: Role.TEACHER, deletedAt: null } }),
      this.prisma.user.count({ where: { role: Role.STUDENT, deletedAt: null } }),
      this.prisma.user.count({ where: { isActive: true, deletedAt: null } }),
      this.prisma.user.count({ where: { isActive: false, deletedAt: null } }),
      this.prisma.user.findMany({
        where: { deletedAt: null },
        include: { profile: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);

    return {
      total,
      admins,
      teachers,
      students,
      active,
      inactive,
      recent: recent.map((u) => this.mapUser(u)),
    };
  }

  private mapUser(u: any) {
    return {
      id: u.id,
      email: u.email,
      role: u.role,
      isActive: u.isActive,
      emailVerified: !!u.emailVerified,
      twoFactorEnabled: u.twoFactorEnabled,
      lastLoginAt: u.lastLoginAt,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
      deletedAt: u.deletedAt,
      profile: u.profile
        ? {
            firstName: u.profile.firstName,
            lastName: u.profile.lastName,
            displayName: u.profile.displayName,
            avatarUrl: u.profile.avatarUrl,
            phone: u.profile.phone,
            bio: u.profile.bio,
            timezone: u.profile.timezone,
            locale: u.profile.locale,
            gender: u.profile.gender,
            city: u.profile.city,
            state: u.profile.state,
            country: u.profile.country,
          }
        : null,
      fullName: u.profile ? `${u.profile.firstName} ${u.profile.lastName}`.trim() : u.email,
      student: u.student
        ? { id: u.student.id, studentNumber: u.student.studentNumber, grade: u.student.grade }
        : null,
      teacher: u.teacher
        ? { id: u.teacher.id, title: u.teacher.title, department: u.teacher.department }
        : null,
      admin: u.admin ? { id: u.admin.id } : null,
    };
  }
}

