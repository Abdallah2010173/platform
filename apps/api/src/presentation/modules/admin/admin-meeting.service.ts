import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { MeetingStatus } from '@platform/database';
import { CreateAdminMeetingDto, UpdateAdminMeetingDto } from './admin-meeting.dto';

@Injectable()
export class AdminMeetingService {
  constructor(private readonly prisma: PrismaService) {}

  getAll() {
    return this.prisma.zoomMeeting.findMany({
      where: { deletedAt: null },
      include: {
        course: { select: { id: true, title: true } },
        teacher: { include: { user: { include: { profile: true } } } },
      },
      orderBy: { startTime: 'desc' },
    });
  }

  async create(dto: CreateAdminMeetingDto) {
    const teacher = await this.prisma.teacher.findFirst({ where: { id: dto.teacherId, deletedAt: null } });
    if (!teacher) throw new NotFoundException('Teacher not found');
    return this.prisma.zoomMeeting.create({
      data: {
        teacherId: dto.teacherId,
        courseId: dto.courseId,
        topic: dto.topic,
        description: dto.description,
        startTime: new Date(dto.startTime),
        durationMinutes: dto.durationMinutes ?? 60,
        joinUrl: dto.joinUrl,
        status: (dto.status ?? 'SCHEDULED') as MeetingStatus,
      },
    });
  }

  async update(id: string, dto: UpdateAdminMeetingDto) {
    await this.require(id);
    return this.prisma.zoomMeeting.update({
      where: { id },
      data: {
        teacherId: dto.teacherId,
        courseId: dto.courseId,
        topic: dto.topic,
        description: dto.description,
        startTime: dto.startTime ? new Date(dto.startTime) : undefined,
        durationMinutes: dto.durationMinutes,
        joinUrl: dto.joinUrl,
        status: dto.status as MeetingStatus | undefined,
      },
    });
  }

  async remove(id: string) {
    await this.require(id);
    await this.prisma.zoomMeeting.update({ where: { id }, data: { deletedAt: new Date() } });
    return { success: true };
  }

  private async require(id: string) {
    const meeting = await this.prisma.zoomMeeting.findFirst({ where: { id, deletedAt: null } });
    if (!meeting) throw new NotFoundException('Meeting not found');
    return meeting;
  }
}
