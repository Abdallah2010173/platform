import { Module } from '@nestjs/common';
import { MediaController } from './media.controller';
import { CoursesModule } from '../courses/courses.module';
import { BunnyStreamService } from '../../../infrastructure/bunny/bunny-stream.service';

@Module({
  imports: [CoursesModule],
  controllers: [MediaController],
  providers: [BunnyStreamService],
  exports: [BunnyStreamService],
})
export class MediaModule {}
