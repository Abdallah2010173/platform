import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database/prisma.service';
import { StudentHelper, AuthenticatedUser } from '../student.helper';

@Injectable()
export class StudentNotificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly studentHelper: StudentHelper,
  ) {}

  async getNotifications(
    user: AuthenticatedUser,
    page = 1,
    limit = 20,
  ): Promise<Record<string, any>> {
    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId: user.id, deletedAt: null },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({
        where: { userId: user.id, deletedAt: null },
      }),
    ]);

    return {
      items: notifications.map((n) => ({
        id: n.id,
        title: n.title,
        body: n.body,
        type: n.type,
        channel: n.channel,
        data: n.data,
        isRead: n.isRead,
        readAt: n.readAt,
        createdAt: n.createdAt,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async markAsRead(user: AuthenticatedUser, notificationId: string) {
    await this.prisma.notification.updateMany({
      where: { id: notificationId, userId: user.id },
      data: { isRead: true, readAt: new Date() },
    });
    return { success: true };
  }

  async markAllAsRead(user: AuthenticatedUser) {
    await this.prisma.notification.updateMany({
      where: { userId: user.id, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    return { success: true };
  }

  async getNotificationSettings(_user: AuthenticatedUser) {
    const settings = await this.prisma.generalSettings.findMany({
      where: { key: { startsWith: 'notification.' } },
    });

    return settings.reduce(
      (acc, s) => {
        acc[s.key.replace('notification.', '')] = s.value;
        return acc;
      },
      {} as Record<string, unknown>,
    );
  }
}
