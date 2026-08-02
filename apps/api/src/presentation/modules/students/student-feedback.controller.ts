import { Controller, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { AuthenticatedUser } from './student.helper';
import { StudentFeedbackService } from './services';
import { RatingDto, ReportIssueDto } from './dto/student.dto';

@ApiTags('Student Feedback')
@ApiBearerAuth()
@Controller('student/feedback')
export class StudentFeedbackController {
  constructor(private readonly feedbackService: StudentFeedbackService) {}

  @Post('lessons/:lessonId/rate')
  @ApiOperation({ summary: 'Rate a lesson' })
  rateLesson(
    @CurrentUser() user: AuthenticatedUser,
    @Param('lessonId') lessonId: string,
    @Body() dto: RatingDto,
  ) {
    return this.feedbackService.rateLesson(user, lessonId, dto);
  }

  @Post('teachers/:teacherId/rate')
  @ApiOperation({ summary: 'Rate a teacher' })
  rateTeacher(
    @CurrentUser() user: AuthenticatedUser,
    @Param('teacherId') teacherId: string,
    @Body() dto: RatingDto,
  ) {
    return this.feedbackService.rateTeacher(user, teacherId, dto);
  }

  @Post('courses/:courseId/rate')
  @ApiOperation({ summary: 'Rate a course' })
  rateCourse(
    @CurrentUser() user: AuthenticatedUser,
    @Param('courseId') courseId: string,
    @Body() dto: RatingDto,
  ) {
    return this.feedbackService.rateCourse(user, courseId, dto);
  }

  @Post('report')
  @ApiOperation({ summary: 'Report an issue' })
  reportIssue(@CurrentUser() user: AuthenticatedUser, @Body() dto: ReportIssueDto) {
    return this.feedbackService.reportIssue(user, dto);
  }

  @Post('meetings/:meetingId/form')
  @ApiOperation({ summary: 'Get meeting feedback form state' })
  getMeetingFeedbackForm(
    @CurrentUser() user: AuthenticatedUser,
    @Param('meetingId') meetingId: string,
  ) {
    return this.feedbackService.getMeetingFeedbackForm(user, meetingId);
  }

  @Post('meetings/:meetingId/submit')
  @ApiOperation({ summary: 'Submit meeting feedback' })
  submitMeetingFeedback(
    @CurrentUser() user: AuthenticatedUser,
    @Param('meetingId') meetingId: string,
    @Body() dto: RatingDto,
  ) {
    return this.feedbackService.submitMeetingFeedback(user, meetingId, dto);
  }
}
