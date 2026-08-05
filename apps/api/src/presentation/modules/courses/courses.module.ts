import { Module } from '@nestjs/common';
import { CoursesController } from './courses.controller';
import { CourseService } from './services/course.service';
import { CategoryService } from './services/category.service';

@Module({
  controllers: [CoursesController],
  providers: [CourseService, CategoryService],
  exports: [CourseService, CategoryService],
})
export class CoursesModule {}
