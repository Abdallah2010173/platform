import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, PaymentMethod, PaymentStatus } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/database/prisma.service';

export type CreatePaymentIntentInput = {
  courseId: string;
  userId: string;
  amount: number;
  currency?: string;
  provider?: string;
  method?: PaymentMethod;
  description?: string;
};

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  async createPaymentIntent(input: CreatePaymentIntentInput) {
    const course = await this.prisma.course.findFirst({
      where: { id: input.courseId, deletedAt: null },
      select: { id: true, title: true, price: true, isFree: true, isPublished: true, status: true },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    if (!course.isPublished || course.status !== 'PUBLISHED') {
      throw new BadRequestException('Course is not available for purchase');
    }

    const amount = Number(course.price ?? input.amount ?? 0);
    if (!course.isFree && amount <= 0) {
      throw new BadRequestException('Course price must be greater than zero');
    }

    const user = await this.prisma.user.findUnique({ where: { id: input.userId }, select: { id: true, email: true } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const existing = await this.prisma.courseStudent.findUnique({
      where: { courseId_studentId: { courseId: input.courseId, studentId: (await this.getStudentId(input.userId)) } },
      select: { id: true, status: true },
    });

    if (existing && existing.status === 'ACTIVE') {
      return {
        success: true,
        alreadyPurchased: true,
        payment: null,
        enrollment: { id: existing.id, status: existing.status },
      };
    }

    const paymentNumber = `PAY-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const payment = await this.prisma.payment.create({
      data: {
        paymentNumber,
        userId: input.userId,
        courseId: input.courseId,
        amount: new Prisma.Decimal(amount),
        currency: input.currency ?? 'USD',
        status: PaymentStatus.PENDING,
        method: input.method ?? PaymentMethod.CARD,
        provider: input.provider ?? 'platform',
        description: input.description ?? `Course purchase: ${course.title}`,
        metadata: {
          courseTitle: course.title,
          initiatedBy: input.userId,
          userEmail: user.email,
        },
      },
    });

    return {
      success: true,
      alreadyPurchased: false,
      payment: {
        id: payment.id,
        paymentNumber: payment.paymentNumber,
        amount: Number(payment.amount),
        currency: payment.currency,
        status: payment.status,
        provider: payment.provider,
        method: payment.method,
        createdAt: payment.createdAt,
      },
      enrollment: null,
    };
  }

  async completePayment(paymentId: string, input?: { providerPaymentId?: string; providerChargeId?: string; metadata?: Record<string, any> }) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { user: true, course: true },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.status === PaymentStatus.COMPLETED) {
      return { success: true, alreadyCompleted: true, payment };
    }

    const studentId = await this.getStudentId(payment.userId);
    const enrollment = await this.prisma.courseStudent.upsert({
      where: { courseId_studentId: { courseId: payment.courseId ?? '', studentId } },
      create: {
        courseId: payment.courseId ?? '',
        studentId,
        status: 'ACTIVE',
        accessType: 'PAID',
        enrolledAt: new Date(),
        progress: 0,
        certificateEligible: false,
      },
      update: {
        status: 'ACTIVE',
        accessType: 'PAID',
        accessGrantedAt: new Date(),
        accessGrantedBy: payment.userId,
      },
      include: { course: true },
    });

    const existingMetadata =
      payment.metadata && typeof payment.metadata === 'object' && !Array.isArray(payment.metadata)
        ? (payment.metadata as Record<string, any>)
        : {};

    await this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: PaymentStatus.COMPLETED,
        paidAt: new Date(),
        providerPaymentId: input?.providerPaymentId,
        providerChargeId: input?.providerChargeId,
        metadata: {
          ...existingMetadata,
          ...(input?.metadata ?? {}),
          enrollmentId: enrollment.id,
        },
      },
    });

    await this.prisma.course.update({
      where: { id: payment.courseId ?? '' },
      data: { totalStudents: { increment: 1 } },
    });

    return {
      success: true,
      alreadyCompleted: false,
      payment: {
        id: payment.id,
        status: PaymentStatus.COMPLETED,
        paidAt: new Date(),
      },
      enrollment: {
        id: enrollment.id,
        courseId: enrollment.courseId,
        status: enrollment.status,
      },
    };
  }

  async getStudentId(userId: string) {
    const student = await this.prisma.student.findUnique({ where: { userId } });
    if (!student) {
      throw new NotFoundException('Student profile is required before purchasing a course');
    }
    return student.id;
  }
}
