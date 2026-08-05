import { Module } from '@nestjs/common';
import { TeacherController } from './teacher.controller';
import { TeacherService } from './teacher.service';
import { TeacherHelper } from './teacher.helper';

@Module({
  controllers: [TeacherController],
  providers: [TeacherService, TeacherHelper],
  exports: [TeacherService, TeacherHelper],
})
export class TeacherModule {}
