import { Controller, Get, Patch, Post, Param, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { AuthenticatedUser } from './student.helper';
import { StudentNotificationService } from './services';

@ApiTags('Student Notifications')
@ApiBearerAuth()
@Controller('student/notifications')
export class StudentNotificationsController {
  constructor(private readonly notificationService: StudentNotificationService) {}

  @Get()
  @ApiOperation({ summary: 'Get notifications' })
  getNotifications(
    @CurrentUser() user: AuthenticatedUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<Record<string, any>> {
    return this.notificationService.getNotifications(
      user,
      page ? Number(page) : 1,
      limit ? Number(limit) : 20,
    );
  }

  @Get('settings')
  @ApiOperation({ summary: 'Get notification settings' })
  getNotificationSettings(@CurrentUser() user: AuthenticatedUser) {
    return this.notificationService.getNotificationSettings(user);
  }

  @Patch(':notificationId/read')
  @ApiOperation({ summary: 'Mark a notification as read' })
  markAsRead(
    @CurrentUser() user: AuthenticatedUser,
    @Param('notificationId') notificationId: string,
  ) {
    return this.notificationService.markAsRead(user, notificationId);
  }

  @Post('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  markAllAsRead(@CurrentUser() user: AuthenticatedUser) {
    return this.notificationService.markAllAsRead(user);
  }
}
