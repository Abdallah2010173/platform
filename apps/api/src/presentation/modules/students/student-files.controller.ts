import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Body,
  UseInterceptors,
  UploadedFile,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import type { Response } from 'express';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { AuthenticatedUser } from './student.helper';
import { StudentFileService, UploadFileInput } from './services';
import { FileUploadDto } from './dto/student.dto';

@ApiTags('Student Files')
@ApiBearerAuth()
@Controller('student/files')
export class StudentFilesController {
  constructor(private readonly fileService: StudentFileService) {}

  @Get()
  @ApiOperation({ summary: 'Get my files' })
  getMyFiles(
    @CurrentUser() user: AuthenticatedUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('kind') kind?: string,
  ) {
    return this.fileService.getMyFiles(
      user,
      page ? Number(page) : 1,
      limit ? Number(limit) : 20,
      kind,
    );
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get file categories with counts' })
  getFileCategories(@CurrentUser() user: AuthenticatedUser) {
    return this.fileService.getFileCategories(user);
  }

  @Post('upload')
  @ApiOperation({ summary: 'Upload a file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        folder: { type: 'string' },
        isPublic: { type: 'boolean' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() file: UploadFileInput | undefined,
    @Body() dto: FileUploadDto,
  ) {
    if (!file) {
      throw new Error('No file provided');
    }
    return this.fileService.uploadFile(user, file, dto);
  }

  @Get(':fileId')
  @ApiOperation({ summary: 'Get file metadata' })
  getFile(
    @CurrentUser() user: AuthenticatedUser,
    @Param('fileId') fileId: string,
  ): Promise<Record<string, any>> {
    return this.fileService.getFile(user, fileId);
  }

  @Get(':fileId/download')
  @ApiOperation({ summary: 'Download a file' })
  async downloadFile(
    @CurrentUser() user: AuthenticatedUser,
    @Param('fileId') fileId: string,
    @Res() res: Response,
  ): Promise<void> {
    const file = await this.fileService.downloadFile(user, fileId);
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(file.originalName)}"`,
    );
    res.send(Buffer.isBuffer(file.content) ? file.content : Buffer.from(file.content));
  }

  @Delete(':fileId')
  @ApiOperation({ summary: 'Delete a file (soft)' })
  deleteFile(@CurrentUser() user: AuthenticatedUser, @Param('fileId') fileId: string) {
    return this.fileService.deleteFile(user, fileId);
  }
}
