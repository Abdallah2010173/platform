import { Module } from '@nestjs/common';
import { CoursesController } from './courses.controller';
import { CourseService } from './services/course.service';
import { CategoryService } from './services/category.service';
import { CourseAccessService } from './services/course-access.service';

@Module({
  controllers: [CoursesController],
  providers: [CourseService, CategoryService, CourseAccessService],
  exports: [CourseService, CategoryService, CourseAccessService],
})
export class CoursesModule {}
