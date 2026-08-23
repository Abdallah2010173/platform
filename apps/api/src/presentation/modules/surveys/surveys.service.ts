import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';

type User = { id: string; role: 'ADMIN' | 'TEACHER' | 'STUDENT' };

@Injectable()
export class SurveysService {
  constructor(private readonly prisma: PrismaService) {}

  async listForTeacher(user: User, courseId?: string) {
    const where: any = { deletedAt: null, ...(courseId ? { courseId } : {}) };
    if (user.role !== 'ADMIN') {
      const teacher = await this.prisma.teacher.findUnique({ where: { userId: user.id } });
      where.course = { teachers: { some: { teacherId: teacher?.id } } };
    }
    return this.prisma.survey.findMany({ where, include: { course: { select: { id: true, title: true } } }, orderBy: { createdAt: 'desc' } });
  }

  async listForStudent(user: User) {
    const student = await this.prisma.student.findUnique({ where: { userId: user.id } });
    const now = new Date();
    return this.prisma.survey.findMany({
      where: { deletedAt: null, isPublished: true, course: { students: { some: { studentId: student?.id, status: 'ACTIVE', deletedAt: null } } }, AND: [{ OR: [{ startsAt: null }, { startsAt: { lte: now } }] }, { OR: [{ endsAt: null }, { endsAt: { gte: now } }] }] },
      include: { course: { select: { id: true, title: true } } }, orderBy: { createdAt: 'desc' },
    });
  }

  async create(user: User, courseId: string, dto: any) {
    await this.assertCourseManager(user, courseId);
    this.validateDates(dto);
    return this.prisma.survey.create({ data: { courseId, createdBy: user.id, title: dto.title, description: dto.description, externalUrl: dto.externalUrl, isPublished: dto.isPublished ?? false, startsAt: dto.startsAt ? new Date(dto.startsAt) : undefined, endsAt: dto.endsAt ? new Date(dto.endsAt) : undefined } });
  }

  async update(user: User, id: string, dto: any) {
    const survey = await this.find(id);
    await this.assertCourseManager(user, survey.courseId);
    this.validateDates(dto, survey);
    return this.prisma.survey.update({ where: { id }, data: { ...dto, startsAt: dto.startsAt ? new Date(dto.startsAt) : undefined, endsAt: dto.endsAt ? new Date(dto.endsAt) : undefined } });
  }

  async remove(user: User, id: string) {
    const survey = await this.find(id); await this.assertCourseManager(user, survey.courseId);
    await this.prisma.survey.update({ where: { id }, data: { deletedAt: new Date(), isPublished: false } });
    return { success: true };
  }

  private async find(id: string) { const item = await this.prisma.survey.findFirst({ where: { id, deletedAt: null } }); if (!item) throw new NotFoundException('Survey not found'); return item; }
  private validateDates(dto: any, existing?: { startsAt: Date | null; endsAt: Date | null }) { const start = dto.startsAt ? new Date(dto.startsAt) : existing?.startsAt; const end = dto.endsAt ? new Date(dto.endsAt) : existing?.endsAt; if (start && end && start >= end) throw new ForbiddenException('Survey end date must be after the start date'); }
  private async assertCourseManager(user: User, courseId: string) {
    if (user.role === 'ADMIN') return;
    const teacher = await this.prisma.teacher.findUnique({ where: { userId: user.id } });
    const assigned = await this.prisma.courseTeacher.findFirst({ where: { courseId, teacherId: teacher?.id, deletedAt: null } });
    if (!assigned) throw new ForbiddenException('You can only manage surveys for your own courses');
  }
}
