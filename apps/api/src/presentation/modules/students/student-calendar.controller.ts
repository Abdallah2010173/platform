import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { AuthenticatedUser } from './student.helper';
import { StudentCalendarService } from './services';

@ApiTags('Student Calendar')
@ApiBearerAuth()
@Controller('student/calendar')
export class StudentCalendarController {
  constructor(private readonly calendarService: StudentCalendarService) {}

  @Get()
  @ApiOperation({ summary: 'Get calendar events (meetings, assignments, exams, bookings)' })
  getCalendar(
    @CurrentUser() user: AuthenticatedUser,
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    return this.calendarService.getCalendar(user, start, end);
  }

  @Get('today')
  @ApiOperation({ summary: 'Get today schedule' })
  getTodaySchedule(@CurrentUser() user: AuthenticatedUser) {
    return this.calendarService.getTodaySchedule(user);
  }
}
