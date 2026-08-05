import { Controller, Get, Post, Delete, Param, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { AuthenticatedUser } from './student.helper';
import { StudentCourseService } from './services';

@ApiTags('Student Courses')
@ApiBearerAuth()
@Controller('student/courses')
export class StudentCoursesController {
  constructor(private readonly courseService: StudentCourseService) {}

  @Get()
  @ApiOperation({ summary: 'Get my enrolled courses' })
  getMyCourses(
    @CurrentUser() user: AuthenticatedUser,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.courseService.getMyCourses(user, status, search);
  }

  @Get('favorites')
  @ApiOperation({ summary: 'Get favorite courses' })
  getFavorites(@CurrentUser() user: AuthenticatedUser) {
    return this.courseService.getFavorites(user);
  }

  @Post(':courseId/enroll')
  @ApiOperation({ summary: 'Enroll in a course' })
  enroll(@CurrentUser() user: AuthenticatedUser, @Param('courseId') courseId: string) {
    return this.courseService.enroll(user, courseId);
  }

  @Delete(':courseId/enroll')
  @ApiOperation({ summary: 'Unenroll from a course' })
  unenroll(@CurrentUser() user: AuthenticatedUser, @Param('courseId') courseId: string) {
    return this.courseService.unenroll(user, courseId);
  }

  @Get(':courseId/enrollment-status')
  @ApiOperation({ summary: 'Get enrollment status for a course' })
  getEnrollmentStatus(@CurrentUser() user: AuthenticatedUser, @Param('courseId') courseId: string) {
    return this.courseService.getEnrollmentStatus(user, courseId);
  }

  @Post(':courseId/favorite')
  @ApiOperation({ summary: 'Toggle favorite for a course' })
  toggleFavorite(@CurrentUser() user: AuthenticatedUser, @Param('courseId') courseId: string) {
    return this.courseService.toggleFavorite(user, courseId);
  }

  @Get(':courseId')
  @ApiOperation({ summary: 'Get enrolled course detail with chapters/lessons' })
  getCourseDetail(
    @CurrentUser() user: AuthenticatedUser,
    @Param('courseId') courseId: string,
  ): Promise<Record<string, any>> {
    return this.courseService.getCourseDetail(user, courseId);
  }

  @Get(':courseId/lessons/:lessonId')
  @ApiOperation({ summary: 'Get lesson content' })
  getLesson(
    @CurrentUser() user: AuthenticatedUser,
    @Param('courseId') courseId: string,
    @Param('lessonId') lessonId: string,
  ): Promise<Record<string, any>> {
    return this.courseService.getLesson(user, courseId, lessonId);
  }

  @Post(':courseId/lessons/:lessonId/complete')
  @ApiOperation({ summary: 'Mark a lesson complete' })
  markLessonComplete(
    @CurrentUser() user: AuthenticatedUser,
    @Param('courseId') courseId: string,
    @Param('lessonId') lessonId: string,
  ) {
    return this.courseService.markLessonComplete(user, courseId, lessonId);
  }
}
