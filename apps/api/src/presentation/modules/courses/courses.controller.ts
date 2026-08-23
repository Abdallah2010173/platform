import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../../decorators/roles.decorator';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { CourseService } from './services/course.service';
import { CategoryService } from './services/category.service';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
  CreateSubCategoryDto,
  UpdateSubCategoryDto,
  CreateSubjectDto,
  UpdateSubjectDto,
  CreateCourseDto,
  UpdateCourseDto,
  PublishCourseDto,
  CreateChapterDto,
  UpdateChapterDto,
  ReorderChaptersDto,
  CreateLessonDto,
  UpdateLessonDto,
  CreateLessonVideoDto,
  UpdateLessonVideoDto,
  CreateLessonPdfDto,
  UpdateLessonPdfDto,
  CreateLessonAttachmentDto,
  CreateLessonResourceDto,
  CreateCourseResourceDto,
  UpdateCourseResourceDto,
  CreateCourseReviewDto,
} from './dto/courses.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { ParsePaginationPipe } from '../../common/pipes/parse-pagination.pipe';

interface AuthUser {
  id: string;
  email: string;
  role: string;
}

@ApiTags('Courses')
@ApiBearerAuth()
@Controller()
export class CoursesController {
  constructor(
    private readonly courseService: CourseService,
    private readonly categoryService: CategoryService,
  ) {}

  // ═══════════════════════════════════════════════════════════════════════════
  // CATEGORIES
  // ═══════════════════════════════════════════════════════════════════════════

  @Get('categories')
  @ApiOperation({ summary: 'List categories (public: published only for non-staff)' })
  findAllCategories(@Query(new ParsePaginationPipe()) query: PaginationDto & { status?: string }) {
    return this.categoryService.findAllCategories(query);
  }

  @Get('categories/tree')
  @ApiOperation({ summary: 'Get full category → subcategory → subject tree' })
  getCategoryTree() {
    return this.categoryService.findAllCategoryTree();
  }

  @Get('categories/:id')
  @ApiOperation({ summary: 'Get category by id' })
  findCategoryById(@Param('id') id: string) {
    return this.categoryService.findCategoryById(id);
  }

  @Post('categories')
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Create a category' })
  createCategory(@Body() dto: CreateCategoryDto, @CurrentUser() user: AuthUser) {
    return this.categoryService.createCategory(dto, user.id);
  }

  @Patch('categories/:id')
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Update a category' })
  updateCategory(
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.categoryService.updateCategory(id, dto, user.id);
  }

  @Delete('categories/:id')
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Soft-delete a category' })
  deleteCategory(@Param('id') id: string) {
    return this.categoryService.deleteCategory(id);
  }

  @Post('categories/:id/restore')
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Restore a soft-deleted category' })
  restoreCategory(@Param('id') id: string) {
    return this.categoryService.restoreCategory(id);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SUB-CATEGORIES
  // ═══════════════════════════════════════════════════════════════════════════

  @Get('sub-categories')
  @ApiOperation({ summary: 'List sub-categories' })
  findAllSubCategories(@Query() query: PaginationDto & { categoryId?: string; status?: string }) {
    return this.categoryService.findAllSubCategories(query);
  }

  @Get('sub-categories/:id')
  @ApiOperation({ summary: 'Get sub-category by id' })
  findSubCategoryById(@Param('id') id: string) {
    return this.categoryService.findSubCategoryById(id);
  }

  @Post('sub-categories')
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Create a sub-category' })
  createSubCategory(@Body() dto: CreateSubCategoryDto) {
    return this.categoryService.createSubCategory(dto);
  }

  @Patch('sub-categories/:id')
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Update a sub-category' })
  updateSubCategory(@Param('id') id: string, @Body() dto: UpdateSubCategoryDto) {
    return this.categoryService.updateSubCategory(id, dto);
  }

  @Delete('sub-categories/:id')
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Soft-delete a sub-category' })
  deleteSubCategory(@Param('id') id: string) {
    return this.categoryService.deleteSubCategory(id);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SUBJECTS
  // ═══════════════════════════════════════════════════════════════════════════

  @Get('subjects')
  @ApiOperation({ summary: 'List subjects' })
  findAllSubjects(
    @Query()
    query: PaginationDto & { categoryId?: string; subCategoryId?: string; status?: string },
  ) {
    return this.categoryService.findAllSubjects(query);
  }

  @Get('subjects/:id')
  @ApiOperation({ summary: 'Get subject by id' })
  findSubjectById(@Param('id') id: string) {
    return this.categoryService.findSubjectById(id);
  }

  @Post('subjects')
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Create a subject' })
  createSubject(@Body() dto: CreateSubjectDto) {
    return this.categoryService.createSubject(dto);
  }

  @Patch('subjects/:id')
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Update a subject' })
  updateSubject(@Param('id') id: string, @Body() dto: UpdateSubjectDto) {
    return this.categoryService.updateSubject(id, dto);
  }

  @Delete('subjects/:id')
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Soft-delete a subject' })
  deleteSubject(@Param('id') id: string) {
    return this.categoryService.deleteSubject(id);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // COURSES
  // ═══════════════════════════════════════════════════════════════════════════

  @Get('courses')
  @ApiOperation({ summary: 'List courses with filters, search, pagination' })
  findAllCourses(
    @Query(new ParsePaginationPipe())
    query: PaginationDto & {
      status?: string;
      categoryId?: string;
      subjectId?: string;
      level?: string;
      isPublished?: string;
      isFeatured?: string;
      price?: 'free' | 'paid';
      teacherId?: string;
    },
    @CurrentUser() user?: AuthUser,
  ) {
    return this.courseService.findAll(query, user);
  }

  @Get('courses/featured')
  @ApiOperation({ summary: 'Get featured courses' })
  getFeaturedCourses() {
    return this.courseService.getFeatured();
  }

  @Get('courses/stats')
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Get course statistics (admin)' })
  getCourseStats() {
    return this.courseService.getStats();
  }

  @Get('courses/slug/:slug')
  @ApiOperation({ summary: 'Get course by slug' })
  findCourseBySlug(@Param('slug') slug: string) {
    return this.courseService.findBySlug(slug);
  }

  @Get('courses/:id')
  @ApiOperation({ summary: 'Get course by id' })
  findCourseById(@Param('id') id: string) {
    return this.courseService.findById(id);
  }

  @Post('courses')
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Create a course' })
  createCourse(@Body() dto: CreateCourseDto, @CurrentUser() user: AuthUser) {
    return this.courseService.create(dto, user);
  }

  @Put('courses/:id')
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Replace a course (alias for update)' })
  replaceCourse(
    @Param('id') id: string,
    @Body() dto: UpdateCourseDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.courseService.update(id, dto, user);
  }

  @Patch('courses/:id')
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Update a course' })
  updateCourse(
    @Param('id') id: string,
    @Body() dto: UpdateCourseDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.courseService.update(id, dto, user);
  }

  @Patch('courses/:id/status')
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Update course status (publish/approve/reject)' })
  updateCourseStatus(
    @Param('id') id: string,
    @Body() dto: PublishCourseDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.courseService.updateStatus(id, dto, user);
  }

  @Delete('courses/:id')
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Soft-delete a course' })
  deleteCourse(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.courseService.delete(id, user);
  }

  @Post('courses/:id/restore')
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Restore a soft-deleted course' })
  restoreCourse(@Param('id') id: string) {
    return this.courseService.restore(id);
  }

  @Post('courses/:id/duplicate')
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Duplicate a course' })
  duplicateCourse(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.courseService.duplicate(id, user);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // REVIEWS
  // ═══════════════════════════════════════════════════════════════════════════

  @Get('courses/:id/reviews')
  @ApiOperation({ summary: 'Get course reviews' })
  getCourseReviews(@Param('id') id: string, @Query() query: PaginationDto & { status?: string }) {
    return this.courseService.getReviews(id, query);
  }

  @Post('courses/:id/reviews')
  @ApiOperation({ summary: 'Add or update a course review (student)' })
  addCourseReview(
    @Param('id') id: string,
    @Body() dto: CreateCourseReviewDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.courseService.addReview(id, dto, user);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CHAPTERS
  // ═══════════════════════════════════════════════════════════════════════════

  @Get('chapters/:id')
  @ApiOperation({ summary: 'Get chapter by id' })
  findChapterById(@Param('id') id: string) {
    return this.courseService.findChapterById(id);
  }

  @Post('courses/:courseId/chapters')
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Add a chapter to a course' })
  addChapter(
    @Param('courseId') courseId: string,
    @Body() dto: CreateChapterDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.courseService.addChapter(courseId, dto, user);
  }

  @Patch('chapters/:id')
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Update a chapter' })
  updateChapter(
    @Param('id') id: string,
    @Body() dto: UpdateChapterDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.courseService.updateChapter(id, dto, user);
  }

  @Delete('chapters/:id')
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Soft-delete a chapter' })
  deleteChapter(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.courseService.deleteChapter(id, user);
  }

  @Post('courses/:courseId/chapters/reorder')
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Reorder chapters of a course' })
  reorderChapters(
    @Param('courseId') courseId: string,
    @Body() dto: ReorderChaptersDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.courseService.reorderChapters(courseId, dto, user);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // LESSONS
  // ═══════════════════════════════════════════════════════════════════════════

  @Get('lessons/:id')
  @ApiOperation({ summary: 'Get lesson by id' })
  findLessonById(@Param('id') id: string) {
    return this.courseService.findLessonById(id);
  }

  @Post('chapters/:chapterId/lessons')
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Add a lesson to a chapter' })
  addLesson(
    @Param('chapterId') chapterId: string,
    @Body() dto: CreateLessonDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.courseService.addLesson(chapterId, dto, user);
  }

  @Patch('lessons/:id')
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Update a lesson' })
  updateLesson(
    @Param('id') id: string,
    @Body() dto: UpdateLessonDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.courseService.updateLesson(id, dto, user);
  }

  @Delete('lessons/:id')
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Soft-delete a lesson' })
  deleteLesson(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.courseService.deleteLesson(id, user);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // LESSON VIDEOS
  // ═══════════════════════════════════════════════════════════════════════════

  @Post('lessons/:lessonId/videos')
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Add a video to a lesson' })
  addLessonVideo(
    @Param('lessonId') lessonId: string,
    @Body() dto: CreateLessonVideoDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.courseService.addLessonVideo(lessonId, dto, user);
  }

  @Patch('videos/:id')
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Update a lesson video' })
  updateLessonVideo(
    @Param('id') id: string,
    @Body() dto: UpdateLessonVideoDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.courseService.updateLessonVideo(id, dto, user);
  }

  @Delete('videos/:id')
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Delete a lesson video' })
  deleteLessonVideo(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.courseService.deleteLessonVideo(id, user);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // LESSON PDFs
  // ═══════════════════════════════════════════════════════════════════════════

  @Post('lessons/:lessonId/pdfs')
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Add a PDF to a lesson' })
  addLessonPdf(
    @Param('lessonId') lessonId: string,
    @Body() dto: CreateLessonPdfDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.courseService.addLessonPdf(lessonId, dto, user);
  }

  @Patch('pdfs/:id')
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Update a lesson PDF' })
  updateLessonPdf(
    @Param('id') id: string,
    @Body() dto: UpdateLessonPdfDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.courseService.updateLessonPdf(id, dto, user);
  }

  @Delete('pdfs/:id')
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Delete a lesson PDF' })
  deleteLessonPdf(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.courseService.deleteLessonPdf(id, user);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // LESSON ATTACHMENTS
  // ═══════════════════════════════════════════════════════════════════════════

  @Post('lessons/:lessonId/attachments')
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Add an attachment to a lesson' })
  addLessonAttachment(
    @Param('lessonId') lessonId: string,
    @Body() dto: CreateLessonAttachmentDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.courseService.addAttachment(lessonId, dto, user);
  }

  @Delete('attachments/:id')
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Delete a lesson attachment' })
  deleteLessonAttachment(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.courseService.deleteAttachment(id, user);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // LESSON RESOURCES
  // ═══════════════════════════════════════════════════════════════════════════

  @Post('lessons/:lessonId/resources')
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Add a resource to a lesson' })
  addLessonResource(
    @Param('lessonId') lessonId: string,
    @Body() dto: CreateLessonResourceDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.courseService.addLessonResource(lessonId, dto, user);
  }

  @Delete('resources/:id')
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Delete a lesson resource' })
  deleteLessonResource(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.courseService.deleteLessonResource(id, user);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // COURSE RESOURCES
  // ═══════════════════════════════════════════════════════════════════════════

  @Get('resources/:id')
  @ApiOperation({ summary: 'Get a course resource by id' })
  findResourceById(@Param('id') id: string) {
    return this.courseService.findResourceById(id);
  }

  @Post('courses/:courseId/resources')
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Add a resource to a course' })
  addCourseResource(
    @Param('courseId') courseId: string,
    @Body() dto: CreateCourseResourceDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.courseService.addCourseResource(courseId, dto, user);
  }

  @Patch('resources/:id')
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Update a course resource' })
  updateCourseResource(
    @Param('id') id: string,
    @Body() dto: UpdateCourseResourceDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.courseService.updateCourseResource(id, dto, user);
  }

  @Delete('resources/:id')
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Delete a course resource' })
  deleteCourseResource(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.courseService.deleteCourseResource(id, user);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete('test')
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'No-op test route' })
  noop() {
    return;
  }
}
