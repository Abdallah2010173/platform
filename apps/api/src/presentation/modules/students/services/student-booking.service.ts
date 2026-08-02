import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database/prisma.service';
import { StudentHelper, AuthenticatedUser } from '../student.helper';

@Injectable()
export class StudentBookingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly studentHelper: StudentHelper,
  ) {}

  async getTeacherAvailability(
    user: AuthenticatedUser,
    teacherId?: string,
  ): Promise<Record<string, any>[]> {
    const availability = await this.prisma.teacherAvailability.findMany({
      where: {
        isAvailable: true,
        ...(teacherId ? { teacherId } : {}),
      },
      include: {
        teacher: {
          include: { user: { include: { profile: true } } },
        },
      },
      orderBy: { dayOfWeek: 'asc' },
    });

    return availability.map((a) => ({
      id: a.id,
      teacherId: a.teacherId,
      teacherName: a.teacher.user.profile
        ? `${a.teacher.user.profile.firstName} ${a.teacher.user.profile.lastName}`
        : a.teacher.user.email,
      dayOfWeek: a.dayOfWeek,
      startTime: a.startTime,
      endTime: a.endTime,
      recurrence: a.recurrence,
      validFrom: a.validFrom,
      validTo: a.validTo,
    }));
  }

  async createBooking(
    user: AuthenticatedUser,
    dto: {
      teacherId: string;
      availabilityId?: string;
      startTime: string;
      endTime: string;
      timezone?: string;
      notes?: string;
      isOnline?: boolean;
    },
  ): Promise<Record<string, any>> {
    const studentId = await this.studentHelper.getStudentId(user);

    const start = new Date(dto.startTime);
    const end = new Date(dto.endTime);

    if (start >= end) {
      throw new ConflictException('End time must be after start time');
    }

    // Check for overlapping bookings
    const overlapping = await this.prisma.booking.findFirst({
      where: {
        studentId,
        statusId: { not: undefined },
        deletedAt: null,
        startTime: { lt: end },
        endTime: { gt: start },
      },
    });

    if (overlapping) {
      throw new ConflictException('You already have a booking in this time range');
    }

    // Default to PENDING status
    const pendingStatus = await this.prisma.bookingStatus.findUnique({
      where: { name: 'PENDING' },
    });

    const teacher = await this.prisma.teacher.findUnique({
      where: { id: dto.teacherId },
    });
    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    const bookingNumber = `BK-${Date.now().toString(36).toUpperCase()}`;

    const booking = await this.prisma.booking.create({
      data: {
        bookingNumber,
        studentId,
        teacherId: dto.teacherId,
        availabilityId: dto.availabilityId,
        statusId: pendingStatus?.id ?? '',
        startTime: start,
        endTime: end,
        timezone: dto.timezone ?? 'UTC',
        notes: dto.notes,
        isOnline: dto.isOnline ?? true,
      },
      include: {
        status: true,
        teacher: { include: { user: { include: { profile: true } } } },
      },
    });

    return {
      id: booking.id,
      bookingNumber: booking.bookingNumber,
      startTime: booking.startTime,
      endTime: booking.endTime,
      status: booking.status.name,
      teacherName: booking.teacher.user.profile
        ? `${booking.teacher.user.profile.firstName} ${booking.teacher.user.profile.lastName}`
        : booking.teacher.user.email,
    };
  }

  async getMyBookings(user: AuthenticatedUser, status?: string): Promise<Record<string, any>[]> {
    const studentId = await this.studentHelper.getStudentId(user);

    const statusFilter = status && status !== 'ALL' ? { status: { name: status as never } } : {};

    const bookings = await this.prisma.booking.findMany({
      where: {
        studentId,
        deletedAt: null,
        ...statusFilter,
      },
      include: {
        status: true,
        teacher: { include: { user: { include: { profile: true } } } },
      },
      orderBy: { startTime: 'desc' },
    });

    return bookings.map((b) => ({
      id: b.id,
      bookingNumber: b.bookingNumber,
      startTime: b.startTime,
      endTime: b.endTime,
      timezone: b.timezone,
      notes: b.notes,
      isOnline: b.isOnline,
      meetingLink: b.meetingLink,
      status: b.status.name,
      statusLabel: b.status.label,
      teacherName: b.teacher.user.profile
        ? `${b.teacher.user.profile.firstName} ${b.teacher.user.profile.lastName}`
        : b.teacher.user.email,
      teacherAvatar: b.teacher.user.profile?.avatarUrl,
    }));
  }

  async cancelBooking(user: AuthenticatedUser, bookingId: string, reason?: string) {
    const studentId = await this.studentHelper.getStudentId(user);

    const booking = await this.prisma.booking.findFirst({
      where: { id: bookingId, studentId },
      include: { status: true },
    });
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    const canceledStatus = await this.prisma.bookingStatus.findUnique({
      where: { name: 'CANCELED' },
    });

    await this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        statusId: canceledStatus?.id ?? booking.statusId,
        cancellationReason: reason,
      },
    });

    // Record history
    await this.prisma.bookingHistory.create({
      data: {
        bookingId,
        fromStatusId: booking.statusId,
        toStatusId: canceledStatus?.id ?? booking.statusId,
        note: reason ?? 'Canceled by student',
      },
    });

    return { success: true };
  }

  async rescheduleBooking(
    user: AuthenticatedUser,
    bookingId: string,
    dto: { startTime: string; endTime: string; reason?: string },
  ) {
    const studentId = await this.studentHelper.getStudentId(user);

    const booking = await this.prisma.booking.findFirst({
      where: { id: bookingId, studentId },
    });
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    const start = new Date(dto.startTime);
    const end = new Date(dto.endTime);

    await this.prisma.reschedule.create({
      data: {
        bookingId,
        requestedBy: 'STUDENT',
        fromStart: booking.startTime,
        fromEnd: booking.endTime,
        toStart: start,
        toEnd: end,
        reason: dto.reason,
        status: 'PENDING',
      },
    });

    return { success: true, message: 'Reschedule request submitted' };
  }

  async getBookingCalendar(user: AuthenticatedUser): Promise<Record<string, any>[]> {
    const studentId = await this.studentHelper.getStudentId(user);

    const bookings = await this.prisma.booking.findMany({
      where: { studentId, deletedAt: null },
      include: {
        status: true,
        teacher: {
          select: {
            user: {
              select: {
                profile: { select: { firstName: true, lastName: true, avatarUrl: true } },
              },
            },
          },
        },
      },
      orderBy: { startTime: 'asc' },
    });

    return bookings.map((b) => ({
      id: b.id,
      title: b.teacher.user.profile
        ? `${b.teacher.user.profile.firstName} ${b.teacher.user.profile.lastName}`
        : 'Teacher',
      start: b.startTime,
      end: b.endTime,
      status: b.status.name,
      statusLabel: b.status.label,
      resourceId: b.id,
    }));
  }

  async getBookingHistory(user: AuthenticatedUser): Promise<Record<string, any>[]> {
    const studentId = await this.studentHelper.getStudentId(user);

    const bookings = await this.prisma.booking.findMany({
      where: { studentId, deletedAt: null },
      include: {
        history: {
          include: {
            fromStatus: true,
            toStatus: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        status: true,
      },
      orderBy: { updatedAt: 'desc' },
      take: 30,
    });

    return bookings.map((b) => ({
      bookingId: b.id,
      bookingNumber: b.bookingNumber,
      startTime: b.startTime,
      status: b.status.name,
      history: b.history.map((h) => ({
        fromStatus: h.fromStatus?.label,
        toStatus: h.toStatus.label,
        note: h.note,
        createdAt: h.createdAt,
      })),
    }));
  }
}
