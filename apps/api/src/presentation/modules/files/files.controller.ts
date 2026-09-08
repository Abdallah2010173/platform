import { Body, Controller, Post, UploadedFile, UseInterceptors, BadRequestException } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
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

  @Post('upload')
  @ApiOperation({ summary: 'Upload a file through the API to avoid browser CORS issues' })
  @UseInterceptors(FileInterceptor('file', {
    storage: memoryStorage(),
    limits: { fileSize: 100 * 1024 * 1024 },
  }))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body('resourceType') resourceType?: 'IMAGE' | 'VIDEO' | 'FILE',
  ) {
    if (!file) throw new BadRequestException('A file is required');
    const contentType = file.mimetype || 'application/octet-stream';
    const detectedType = contentType.startsWith('image/') ? 'IMAGE' : contentType.startsWith('video/') ? 'VIDEO' : 'FILE';
    if (resourceType && resourceType !== detectedType) {
      throw new BadRequestException(`The selected file must be a ${resourceType.toLowerCase()}`);
    }
    const uploaded = await this.storage.uploadBuffer(file.originalname, contentType, file.buffer);
    return {
      ...uploaded,
      fileName: file.originalname,
      contentType,
    };
  }
}
