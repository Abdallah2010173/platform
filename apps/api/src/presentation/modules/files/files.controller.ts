import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { R2StorageService } from '../../../infrastructure/storage/r2-storage.service';
import { UploadUrlDto } from './dto/upload-url.dto';

@ApiTags('Files')
@ApiBearerAuth()
@Controller('files')
export class FilesController {
  constructor(private readonly storage: R2StorageService) {}

  @Post('upload-url')
  @ApiOperation({ summary: 'Create a presigned R2 upload URL' })
  getUploadUrl(@Body() dto: UploadUrlDto) {
    return this.storage.getPresignedUploadUrl(dto.fileName, dto.contentType, dto.resourceType);
  }
}
