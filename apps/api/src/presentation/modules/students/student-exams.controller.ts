import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { AuthenticatedUser } from './student.helper';
import { StudentExamService } from './services';
import { SubmitExamDto } from './dto/student.dto';

@ApiTags('Student Exams')
@ApiBearerAuth()
@Controller('student/exams')
export class StudentExamsController {
  constructor(private readonly examService: StudentExamService) {}

  @Get()
  @ApiOperation({ summary: 'Get available exams' })
  getAvailableExams(@CurrentUser() user: AuthenticatedUser) {
    return this.examService.getAvailableExams(user);
  }

  @Get('results')
  @ApiOperation({ summary: 'Get exam results' })
  getResults(@CurrentUser() user: AuthenticatedUser) {
    return this.examService.getResults(user);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get exam attempt history' })
  getExamHistory(@CurrentUser() user: AuthenticatedUser) {
    return this.examService.getExamHistory(user);
  }

  @Get(':examId/leaderboard')
  @ApiOperation({ summary: 'Get exam leaderboard' })
  getLeaderboard(@CurrentUser() user: AuthenticatedUser, @Param('examId') examId: string) {
    return this.examService.getLeaderboard(user, examId);
  }

  @Post(':examId/start')
  @ApiOperation({ summary: 'Start an exam' })
  startExam(@CurrentUser() user: AuthenticatedUser, @Param('examId') examId: string) {
    return this.examService.startExam(user, examId);
  }

  @Post('attempts/:attemptId/submit')
  @ApiOperation({ summary: 'Submit an exam attempt' })
  submitExam(
    @CurrentUser() user: AuthenticatedUser,
    @Param('attemptId') attemptId: string,
    @Body() dto: SubmitExamDto,
  ) {
    return this.examService.submitExam(user, attemptId, dto);
  }
}
