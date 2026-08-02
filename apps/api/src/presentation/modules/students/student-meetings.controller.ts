import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { AuthenticatedUser } from './student.helper';
import { StudentMeetingService } from './services';

@ApiTags('Student Meetings')
@ApiBearerAuth()
@Controller('student/meetings')
export class StudentMeetingsController {
  constructor(private readonly meetingService: StudentMeetingService) {}

  @Get('upcoming')
  @ApiOperation({ summary: 'Get upcoming meetings' })
  getUpcomingMeetings(@CurrentUser() user: AuthenticatedUser): Promise<Record<string, any>[]> {
    return this.meetingService.getUpcomingMeetings(user);
  }

  @Get('attendance')
  @ApiOperation({ summary: 'Get attendance history' })
  getAttendanceHistory(@CurrentUser() user: AuthenticatedUser): Promise<Record<string, any>[]> {
    return this.meetingService.getAttendanceHistory(user);
  }

  @Get(':meetingId')
  @ApiOperation({ summary: 'Get meeting detail' })
  getMeetingDetail(
    @CurrentUser() user: AuthenticatedUser,
    @Param('meetingId') meetingId: string,
  ): Promise<Record<string, any>> {
    return this.meetingService.getMeetingDetail(user, meetingId);
  }
}
