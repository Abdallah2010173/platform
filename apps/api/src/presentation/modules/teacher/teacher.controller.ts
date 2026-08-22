import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../../decorators/roles.decorator';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { TeacherService } from './teacher.service';
import { AuthenticatedUser } from './teacher.helper';
import {
  UpdateTeacherProfileDto,
  ChangeTeacherPasswordDto,
  CreateAssignmentDto,
  UpdateAssignmentDto,
  GradeSubmissionDto,
  CreateExamDto,
  UpdateExamDto,
  CreateQuestionBankDto,
  AddQuestionsDto,
  CreateMeetingDto,
  UpdateMeetingDto,
  SetAvailabilityDto,
  UpdateAvailabilityDto,
} from './dto/teacher.dto';

@ApiTags('Teacher')
@ApiBearerAuth()
@Roles(Role.TEACHER, Role.ADMIN)
@Controller('teacher')
export class TeacherController {
  constructor(private readonly teacherService: TeacherService) {}

  // ═══════════════════════════════════════════════════════════════════════════
  // DASHBOARD
  // ═══════════════════════════════════════════════════════════════════════════

  @Get('stats')
  @ApiOperation({ summary: 'Get teacher dashboard stats' })
  getStats(@CurrentUser() user: AuthenticatedUser) {
    return this.teacherService.getStats(user);
  }

  @Get('analytics')
  @ApiOperation({ summary: 'Get teacher course analytics' })
  getAnalytics(@CurrentUser() user: AuthenticatedUser) {
    return this.teacherService.getAnalytics(user);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PROFILE
  // ═══════════════════════════════════════════════════════════════════════════

  @Get('profile')
  @ApiOperation({ summary: 'Get teacher profile' })
  getProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.teacherService.getProfile(user);
  }

  @Patch('profile')
  @ApiOperation({ summary: 'Update teacher profile' })
  updateProfile(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateTeacherProfileDto) {
    return this.teacherService.updateProfile(user, dto);
  }

  @Post('profile/change-password')
  @ApiOperation({ summary: 'Change teacher password' })
  changePassword(@CurrentUser() user: AuthenticatedUser, @Body() dto: ChangeTeacherPasswordDto) {
    return this.teacherService.changePassword(user, dto);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STUDENTS
  // ═══════════════════════════════════════════════════════════════════════════

  @Get('students')
  @ApiOperation({ summary: 'Get my students' })
  getStudents(
    @CurrentUser() user: AuthenticatedUser,
    @Query('courseId') courseId?: string,
    @Query('search') search?: string,
  ) {
    return this.teacherService.getStudents(user, courseId, search);
  }

  @Get('students/all')
  @ApiOperation({ summary: 'Get all active platform students' })
  getAllStudents(@CurrentUser() user: AuthenticatedUser, @Query('search') search?: string) {
    return this.teacherService.getAllStudents(user, search);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ASSIGNMENTS / HOMEWORK
  // ═══════════════════════════════════════════════════════════════════════════

  @Get('assignments')
  @ApiOperation({ summary: 'Get my assignments' })
  getAssignments(@CurrentUser() user: AuthenticatedUser, @Query('courseId') courseId?: string) {
    return this.teacherService.getAssignments(user, courseId);
  }

  @Post('courses/:courseId/assignments')
  @ApiOperation({ summary: 'Create an assignment' })
  createAssignment(
    @CurrentUser() user: AuthenticatedUser,
    @Param('courseId') courseId: string,
    @Body() dto: CreateAssignmentDto,
  ) {
    return this.teacherService.createAssignment(user, courseId, dto);
  }

  @Patch('assignments/:assignmentId')
  @ApiOperation({ summary: 'Update an assignment' })
  updateAssignment(
    @CurrentUser() user: AuthenticatedUser,
    @Param('assignmentId') assignmentId: string,
    @Body() dto: UpdateAssignmentDto,
  ) {
    return this.teacherService.updateAssignment(user, assignmentId, dto);
  }

  @Delete('assignments/:assignmentId')
  @ApiOperation({ summary: 'Delete an assignment' })
  deleteAssignment(
    @CurrentUser() user: AuthenticatedUser,
    @Param('assignmentId') assignmentId: string,
  ) {
    return this.teacherService.deleteAssignment(user, assignmentId);
  }

  @Get('assignments/:assignmentId/submissions')
  @ApiOperation({ summary: 'Get assignment submissions' })
  getSubmissions(
    @CurrentUser() user: AuthenticatedUser,
    @Param('assignmentId') assignmentId: string,
  ) {
    return this.teacherService.getSubmissions(user, assignmentId);
  }

  @Post('submissions/:submissionId/grade')
  @ApiOperation({ summary: 'Grade a submission' })
  gradeSubmission(
    @CurrentUser() user: AuthenticatedUser,
    @Param('submissionId') submissionId: string,
    @Body() dto: GradeSubmissionDto,
  ) {
    return this.teacherService.gradeSubmission(user, submissionId, dto);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // EXAMS
  // ═══════════════════════════════════════════════════════════════════════════

  @Get('exams')
  @ApiOperation({ summary: 'Get my exams' })
  getExams(@CurrentUser() user: AuthenticatedUser, @Query('courseId') courseId?: string) {
    return this.teacherService.getExams(user, courseId);
  }

  @Post('courses/:courseId/exams')
  @ApiOperation({ summary: 'Create an exam' })
  createExam(
    @CurrentUser() user: AuthenticatedUser,
    @Param('courseId') courseId: string,
    @Body() dto: CreateExamDto,
  ) {
    return this.teacherService.createExam(user, courseId, dto);
  }

  @Patch('exams/:examId')
  @ApiOperation({ summary: 'Update an exam' })
  updateExam(
    @CurrentUser() user: AuthenticatedUser,
    @Param('examId') examId: string,
    @Body() dto: UpdateExamDto,
  ) {
    return this.teacherService.updateExam(user, examId, dto);
  }

  @Delete('exams/:examId')
  @ApiOperation({ summary: 'Delete an exam' })
  deleteExam(@CurrentUser() user: AuthenticatedUser, @Param('examId') examId: string) {
    return this.teacherService.deleteExam(user, examId);
  }

  @Get('exams/:examId/results')
  @ApiOperation({ summary: 'Get exam results' })
  getExamResults(@CurrentUser() user: AuthenticatedUser, @Param('examId') examId: string) {
    return this.teacherService.getExamResults(user, examId);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // QUESTION BANK
  // ═══════════════════════════════════════════════════════════════════════════

  @Get('question-banks')
  @ApiOperation({ summary: 'Get my question banks' })
  getQuestionBanks(@CurrentUser() user: AuthenticatedUser, @Query('courseId') courseId?: string) {
    return this.teacherService.getQuestionBanks(user, courseId);
  }

  @Post('question-banks')
  @ApiOperation({ summary: 'Create a question bank' })
  createQuestionBank(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateQuestionBankDto) {
    return this.teacherService.createQuestionBank(user, dto);
  }

  @Post('question-banks/:bankId/questions')
  @ApiOperation({ summary: 'Add questions to a bank' })
  addQuestions(
    @CurrentUser() user: AuthenticatedUser,
    @Param('bankId') bankId: string,
    @Body() dto: AddQuestionsDto,
  ) {
    return this.teacherService.addQuestions(user, bankId, dto);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MEETINGS
  // ═══════════════════════════════════════════════════════════════════════════

  @Get('meetings')
  @ApiOperation({ summary: 'Get my meetings' })
  getMeetings(@CurrentUser() user: AuthenticatedUser) {
    return this.teacherService.getMeetings(user);
  }

  @Post('meetings')
  @ApiOperation({ summary: 'Create a meeting' })
  createMeeting(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateMeetingDto) {
    return this.teacherService.createMeeting(user, dto);
  }

  @Patch('meetings/:meetingId')
  @ApiOperation({ summary: 'Update a meeting' })
  updateMeeting(
    @CurrentUser() user: AuthenticatedUser,
    @Param('meetingId') meetingId: string,
    @Body() dto: UpdateMeetingDto,
  ) {
    return this.teacherService.updateMeeting(user, meetingId, dto);
  }

  @Delete('meetings/:meetingId')
  @ApiOperation({ summary: 'Delete a meeting' })
  deleteMeeting(@CurrentUser() user: AuthenticatedUser, @Param('meetingId') meetingId: string) {
    return this.teacherService.deleteMeeting(user, meetingId);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // AVAILABILITY
  // ═══════════════════════════════════════════════════════════════════════════

  @Get('availability')
  @ApiOperation({ summary: 'Get my availability' })
  getAvailability(@CurrentUser() user: AuthenticatedUser) {
    return this.teacherService.getAvailability(user);
  }

  @Post('availability')
  @ApiOperation({ summary: 'Set availability' })
  setAvailability(@CurrentUser() user: AuthenticatedUser, @Body() dto: SetAvailabilityDto) {
    return this.teacherService.setAvailability(user, dto);
  }

  @Patch('availability/:availabilityId')
  @ApiOperation({ summary: 'Update availability' })
  updateAvailability(
    @CurrentUser() user: AuthenticatedUser,
    @Param('availabilityId') availabilityId: string,
    @Body() dto: UpdateAvailabilityDto,
  ) {
    return this.teacherService.updateAvailability(user, availabilityId, dto);
  }

  @Delete('availability/:availabilityId')
  @ApiOperation({ summary: 'Delete availability' })
  deleteAvailability(
    @CurrentUser() user: AuthenticatedUser,
    @Param('availabilityId') availabilityId: string,
  ) {
    return this.teacherService.deleteAvailability(user, availabilityId);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CALENDAR
  // ═══════════════════════════════════════════════════════════════════════════

  @Get('calendar')
  @ApiOperation({ summary: 'Get my calendar' })
  getCalendar(
    @CurrentUser() user: AuthenticatedUser,
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    return this.teacherService.getCalendar(user, start, end);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ATTENDANCE
  // ═══════════════════════════════════════════════════════════════════════════

  @Get('meetings/:meetingId/attendance')
  @ApiOperation({ summary: 'Get meeting attendance' })
  getAttendance(@CurrentUser() user: AuthenticatedUser, @Param('meetingId') meetingId: string) {
    return this.teacherService.getAttendance(user, meetingId);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // NOTIFICATIONS
  // ═══════════════════════════════════════════════════════════════════════════

  @Get('notifications')
  @ApiOperation({ summary: 'Get my notifications' })
  getNotifications(
    @CurrentUser() user: AuthenticatedUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.teacherService.getNotifications(
      user,
      page ? Number(page) : 1,
      limit ? Number(limit) : 20,
    );
  }

  @Post('notifications/:notificationId/read')
  @ApiOperation({ summary: 'Mark a notification read' })
  markNotificationRead(
    @CurrentUser() user: AuthenticatedUser,
    @Param('notificationId') notificationId: string,
  ) {
    return this.teacherService.markNotificationRead(user, notificationId);
  }

  @Post('notifications/read-all')
  @ApiOperation({ summary: 'Mark all notifications read' })
  markAllNotificationsRead(@CurrentUser() user: AuthenticatedUser) {
    return this.teacherService.markAllNotificationsRead(user);
  }
}
