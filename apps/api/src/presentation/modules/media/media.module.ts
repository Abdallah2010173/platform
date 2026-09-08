import { Module, OnModuleInit } from '@nestjs/common';
import { MediaController } from './media.controller';
import { CoursesModule } from '../courses/courses.module';
import { FilesModule } from '../files/files.module';
import { VideoProcessingQueue } from './video-processing.queue';
import { VideoProcessingService } from './video-processing.service';
import { R2StorageService } from '../../../infrastructure/storage/r2-storage.service';

@Module({
  imports: [CoursesModule, FilesModule],
  controllers: [MediaController],
  providers: [VideoProcessingService, VideoProcessingQueue],
})
export class MediaModule implements OnModuleInit {
  constructor(private readonly r2Storage: R2StorageService) {}

  async onModuleInit() {
    await this.r2Storage.ensurePrefix('uploads/videos');
  }
}
