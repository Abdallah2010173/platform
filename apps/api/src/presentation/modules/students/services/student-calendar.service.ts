import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database/prisma.service';
import { StudentHelper, AuthenticatedUser } from '../student.helper';

@Injectable()
export class StudentCalendarService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly studentHelper: StudentHelper,
  ) {}

  async getCalendar(user: AuthenticatedUser, start?: string, end?: string) {
    const studentId = await this.studentHelper.getStudentId(user);

    const startDate = start ? new Date(start) : new Date(new Date().setHours(0, 0, 0, 0));
    const endDate = end ? new Date(end) : new Date(new Date().setDate(startDate.getDate() + 30));

    // Zoom meetings for the student's courses
    const meetings = await this.prisma.meetingSchedule.findMany({
      where: {
        startTime: { gte: startDate, lte: endDate },
        zoomMeeting: {
          status: { in: ['SCHEDULED', 'LIVE'] },
          OR: [
            { course: { students: { some: { studentId } } } },
            { attendance: { some: { studentId } } },
          ],
        },
      },
      include: { zoomMeeting: { select: { id: true, topic: true, joinUrl: true } } },
    });

    // Assignments (homework deadlines)
    const assignments = await this.prisma.assignment.findMany({
      where: {
        dueDate: { gte: startDate, lte: endDate },
        isPublished: true,
        course: { students: { some: { studentId } } },
      },
      select: {
        id: true,
        title: true,
        dueDate: true,
        course: { select: { title: true } },
      },
    });

    // Exams
    const exams = await this.prisma.exam.findMany({
      where: {
        isPublished: true,
        OR: [
          { startTime: { gte: startDate, lte: endDate } },
          { endTime: { gte: startDate, lte: endDate } },
        ],
        course: { students: { some: { studentId } } },
      },
      select: {
        id: true,
        title: true,
        startTime: true,
        endTime: true,
        course: { select: { title: true } },
      },
    });

    // Bookings
    const bookings = await this.prisma.booking.findMany({
      where: {
        studentId,
        deletedAt: null,
        startTime: { gte: startDate, lte: endDate },
      },
      select: {
        id: true,
        bookingNumber: true,
        startTime: true,
        endTime: true,
        status: { select: { name: true, label: true } },
      },
    });

    // Schedules assigned to student
    const schedules = await this.prisma.studentSchedule.findMany({
      where: { studentId },
      include: { schedule: true },
    });

    return {
      meetings: meetings.map((m) => ({
        id: m.id,
        type: 'MEETING',
        title: m.title,
        start: m.startTime,
        end: m.endTime,
        meetingId: m.zoomMeetingId,
        joinUrl: m.zoomMeeting.joinUrl,
      })),
      assignments: assignments.map((a) => ({
        id: a.id,
        type: 'ASSIGNMENT',
        title: a.title,
        courseTitle: a.course.title,
        dueDate: a.dueDate,
      })),
      exams: exams.map((e) => ({
        id: e.id,
        type: 'EXAM',
        title: e.title,
        courseTitle: e.course.title,
        startTime: e.startTime,
        endTime: e.endTime,
      })),
      bookings: bookings.map((b) => ({
        id: b.id,
        type: 'BOOKING',
        title: b.bookingNumber,
        start: b.startTime,
        end: b.endTime,
        status: b.status.label,
      })),
      schedules: schedules.map((s) => ({
        id: s.id,
        type: 'SCHEDULE',
        title: s.schedule.title,
        start: s.schedule.startTime,
        end: s.schedule.endTime,
        isPublished: s.schedule.isPublished,
      })),
    };
  }

  async getTodaySchedule(user: AuthenticatedUser) {
    const studentId = await this.studentHelper.getStudentId(user);

    const start = new Date(new Date().setHours(0, 0, 0, 0));
    const end = new Date(new Date().setHours(23, 59, 59, 999));

    const [meetings, assignments, exams, bookings] = await Promise.all([
      this.prisma.meetingSchedule.findMany({
        where: {
          startTime: { gte: start, lte: end },
          zoomMeeting: {
            status: { in: ['SCHEDULED', 'LIVE'] },
            OR: [
              { course: { students: { some: { studentId } } } },
              { attendance: { some: { studentId } } },
            ],
          },
        },
        include: { zoomMeeting: { select: { topic: true, joinUrl: true } } },
        orderBy: { startTime: 'asc' },
      }),
      this.prisma.assignment.findMany({
        where: {
          dueDate: { gte: start, lte: end },
          isPublished: true,
          course: { students: { some: { studentId } } },
        },
        select: { id: true, title: true, dueDate: true },
      }),
      this.prisma.exam.findMany({
        where: {
          isPublished: true,
          OR: [{ startTime: { lte: end } }, { endTime: { gte: start } }],
          course: { students: { some: { studentId } } },
        },
        select: { id: true, title: true, startTime: true, endTime: true },
      }),
      this.prisma.booking.findMany({
        where: {
          studentId,
          deletedAt: null,
          startTime: { gte: start, lte: end },
        },
        select: { id: true, bookingNumber: true, startTime: true, endTime: true },
      }),
    ]);

    return {
      meetings: meetings.map((m) => ({
        id: m.id,
        title: m.zoomMeeting.topic,
        startTime: m.startTime,
        endTime: m.endTime,
        joinUrl: m.zoomMeeting.joinUrl,
      })),
      assignments: assignments.map((a) => ({
        id: a.id,
        title: a.title,
        dueDate: a.dueDate,
      })),
      exams: exams.map((e) => ({
        id: e.id,
        title: e.title,
        startTime: e.startTime,
        endTime: e.endTime,
      })),
      bookings: bookings.map((b) => ({
        id: b.id,
        bookingNumber: b.bookingNumber,
        startTime: b.startTime,
        endTime: b.endTime,
      })),
    };
  }
}
