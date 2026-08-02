import { Controller, Get, Post, Param, Query, Body } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { AuthenticatedUser } from './student.helper';
import { StudentHomeworkService } from './services';
import { SubmitAssignmentDto } from './dto/student.dto';

@ApiTags('Student Homework')
@ApiBearerAuth()
@Controller('student/homework')
export class StudentHomeworkController {
  constructor(private readonly homeworkService: StudentHomeworkService) {}

  @Get('assignments')
  @ApiOperation({ summary: 'Get assignments for enrolled courses' })
  getAssignments(
    @CurrentUser() user: AuthenticatedUser,
    @Query('status') status?: string,
  ): Promise<Record<string, any>[]> {
    return this.homeworkService.getAssignments(user, status);
  }

  @Get('assignments/:assignmentId')
  @ApiOperation({ summary: 'Get assignment detail' })
  getAssignmentDetail(
    @CurrentUser() user: AuthenticatedUser,
    @Param('assignmentId') assignmentId: string,
  ): Promise<Record<string, any>> {
    return this.homeworkService.getAssignmentDetail(user, assignmentId);
  }

  @Post('assignments/:assignmentId/submit')
  @ApiOperation({ summary: 'Submit or resubmit an assignment' })
  submitAssignment(
    @CurrentUser() user: AuthenticatedUser,
    @Param('assignmentId') assignmentId: string,
    @Body() dto: SubmitAssignmentDto,
  ) {
    return this.homeworkService.submitAssignment(user, assignmentId, dto);
  }

  @Get('grades')
  @ApiOperation({ summary: 'Get graded submissions' })
  getGrades(@CurrentUser() user: AuthenticatedUser) {
    return this.homeworkService.getGrades(user);
  }
}
