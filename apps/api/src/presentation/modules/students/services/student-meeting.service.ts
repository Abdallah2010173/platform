import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database/prisma.service';
import { StudentHelper, AuthenticatedUser } from '../student.helper';

@Injectable()
export class StudentMeetingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly studentHelper: StudentHelper,
  ) {}

  async getUpcomingMeetings(user: AuthenticatedUser): Promise<Record<string, any>[]> {
    const studentId = await this.studentHelper.getStudentId(user);

    const schedules = await this.prisma.meetingSchedule.findMany({
      where: {
        startTime: { gte: new Date() },
        zoomMeeting: { status: 'SCHEDULED' },
        OR: [
          // Meetings scheduled for the student's course
          { course: { students: { some: { studentId } } } },
          // Direct attendance records for the student
          { attendance: { some: { studentId } } },
        ],
      },
      include: {
        zoomMeeting: {
          include: {
            course: { select: { id: true, title: true } },
          },
        },
      },
      orderBy: { startTime: 'asc' },
      take: 20,
    });

    return schedules.map((s) => ({
      id: s.id,
      meetingId: s.zoomMeetingId,
      title: s.title,
      startTime: s.startTime,
      endTime: s.endTime,
      isRecurring: s.isRecurring,
      status: s.status,
      joinUrl: s.zoomMeeting.joinUrl,
      password: s.zoomMeeting.password,
      courseId: s.zoomMeeting.course?.id,
      courseTitle: s.zoomMeeting.course?.title,
    }));
  }

  async getMeetingDetail(user: AuthenticatedUser, meetingId: string): Promise<Record<string, any>> {
    const studentId = await this.studentHelper.getStudentId(user);

    const meeting = await this.prisma.zoomMeeting.findFirst({
      where: {
        id: meetingId,
        OR: [
          { course: { students: { some: { studentId } } } },
          { attendance: { some: { studentId } } },
        ],
      },
      include: {
        course: { select: { id: true, title: true } },
        recordings: true,
        attendance: {
          where: { studentId },
        },
      },
    });

    if (!meeting) {
      throw new NotFoundException('Meeting not found or not accessible');
    }

    return {
      id: meeting.id,
      topic: meeting.topic,
      description: meeting.description,
      agenda: meeting.agenda,
      startTime: meeting.startTime,
      durationMinutes: meeting.durationMinutes,
      timezone: meeting.timezone,
      joinUrl: meeting.joinUrl,
      password: meeting.password,
      status: meeting.status,
      courseId: meeting.course?.id,
      courseTitle: meeting.course?.title,
      recordings: meeting.recordings.map((r) => ({
        id: r.id,
        title: r.title,
        url: r.url,
        durationSeconds: r.durationSeconds,
      })),
      attendance: meeting.attendance.map((a) => ({
        id: a.id,
        joinedAt: a.joinedAt,
        leftAt: a.leftAt,
        durationSeconds: a.durationSeconds,
        status: a.status,
      })),
    };
  }

  async getAttendanceHistory(user: AuthenticatedUser): Promise<Record<string, any>[]> {
    const studentId = await this.studentHelper.getStudentId(user);

    const records = await this.prisma.meetingAttendance.findMany({
      where: { studentId },
      include: {
        meeting: {
          select: {
            id: true,
            topic: true,
            startTime: true,
            course: { select: { title: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return records.map((r) => ({
      id: r.id,
      meetingId: r.meetingId,
      topic: r.meeting.topic,
      courseTitle: r.meeting.course?.title,
      startTime: r.meeting.startTime,
      joinedAt: r.joinedAt,
      leftAt: r.leftAt,
      durationSeconds: r.durationSeconds,
      status: r.status,
    }));
  }
}
