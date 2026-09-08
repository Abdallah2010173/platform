import { Module } from '@nestjs/common';
import { R2StorageService } from '../../../infrastructure/storage/r2-storage.service';
import { FilesController } from './files.controller';

@Module({
  controllers: [FilesController],
  providers: [R2StorageService],
  exports: [R2StorageService],
})
export class FilesModule {}
