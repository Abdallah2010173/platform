import { Module, OnModuleInit } from '@nestjs/common';
import { MediaController } from './media.controller';
import { CoursesModule } from '../courses/courses.module';
import { FilesModule } from '../files/files.module';
import { R2StorageService } from '../../../infrastructure/storage/r2-storage.service';

@Module({
  imports: [CoursesModule, FilesModule],
  controllers: [MediaController],
  providers: [],
})
export class MediaModule implements OnModuleInit {
  constructor(private readonly r2Storage: R2StorageService) {}

  async onModuleInit() {
    await this.r2Storage.ensurePrefix('uploads/videos');
  }
}
