import { Module } from '@nestjs/common';
import { MediaController } from './media.controller';
import { CoursesModule } from '../courses/courses.module';
import { FilesModule } from '../files/files.module';
import { VideoProcessingQueue } from './video-processing.queue';
import { VideoProcessingService } from './video-processing.service';

@Module({
  imports: [CoursesModule, FilesModule],
  controllers: [MediaController],
  providers: [VideoProcessingService, VideoProcessingQueue],
})
export class MediaModule {}
