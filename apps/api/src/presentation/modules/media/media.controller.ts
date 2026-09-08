import {
  Controller,
  Get,
  Param,
  Post,
  HttpCode,
  HttpStatus,
  Res,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { VideoSource } from '@prisma/client';
import { diskStorage } from 'multer';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { R2StorageService } from '../../../infrastructure/storage/r2-storage.service';
import { CourseAccessService } from '../courses/services/course-access.service';
import { VideoProcessingQueue } from './video-processing.queue';

const allowedVideoTypes = new Set(['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime']);

@ApiTags('Media')
@ApiBearerAuth()
@Controller('media')
export class MediaController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly courseAccessService: CourseAccessService,
    private readonly r2Storage: R2StorageService,
    private readonly videoQueue: VideoProcessingQueue,
  ) {}

  @Post('lessons/:lessonId/videos')
  @ApiConsumes('multipart/form-data')
  @HttpCode(HttpStatus.ACCEPTED)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, callback) => {
          const directory = join(process.cwd(), 'uploads', 'video-tmp');
          mkdirSync(directory, { recursive: true });
          callback(null, directory);
        },
        filename: (_req, file, callback) => callback(null, `${randomUUID()}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`),
      }),
      limits: { fileSize: 1024 * 1024 * 1024 },
      fileFilter: (_req, file, callback) => callback(null, allowedVideoTypes.has(file.mimetype)),
    }),
  )
  async uploadVideo(@CurrentUser() user: any, @Param('lessonId') lessonId: string, @UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Upload an MP4, WebM, OGG, or MOV video up to 1 GB');
    }

    const lesson = await this.prisma.lesson.findFirst({
      where: { id: lessonId, deletedAt: null },
      include: { course: true },
    });

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    await this.assertTeacherAccess(user, lesson.courseId);

    const source = await this.r2Storage.uploadLocalFile(file.originalname, file.mimetype, file.path);
    const record = await this.prisma.lessonVideo.create({
      data: {
        lessonId,
        title: file.originalname || `lesson-${lessonId}`,
        description: 'Queued for HLS processing',
        url: '',
        source: VideoSource.UPLOAD,
        sizeBytes: file.size ? BigInt(file.size) : undefined,
        quality: 'AUTO',
        transcodingStatus: 'QUEUED',
        sourceKey: source.fileKey,
      },
    });

    const job = await this.videoQueue.enqueue({
      videoId: record.id,
      lessonId,
      sourcePath: file.path,
      originalName: file.originalname,
      contentType: file.mimetype,
    });
    const queued = await this.prisma.lessonVideo.update({
      where: { id: record.id },
      data: { uploadId: job.id },
    });
    return { id: queued.id, status: queued.transcodingStatus, jobId: job.id };
  }

  @Get('videos/:id/status')
  async videoStatus(@CurrentUser() user: any, @Param('id') id: string) {
    const video = await this.findVideo(id);
    await this.assertViewerAccess(user, video.lesson.courseId, video.lesson.isPublished);
    return {
      id: video.id,
      status: video.transcodingStatus ?? 'UNKNOWN',
      error: video.processingError,
      ready: video.transcodingStatus === 'READY',
    };
  }

  @Get('videos/:id/manifest-url')
  async manifestUrl(@CurrentUser() user: any, @Param('id') id: string) {
    const video = await this.findVideo(id);
    await this.assertViewerAccess(user, video.lesson.courseId, video.lesson.isPublished);
    if (video.transcodingStatus !== 'READY' || !video.manifestKey) {
      throw new NotFoundException('Video is still being processed');
    }
    return { url: await this.r2Storage.getPresignedDownloadUrl(video.manifestKey, 300), expiresIn: 300 };
  }

  @Get('videos/:id/key')
  async encryptionKey(@CurrentUser() user: any, @Param('id') id: string, @Res() response: Response) {
    const video = await this.findVideo(id);
    await this.assertViewerAccess(user, video.lesson.courseId, video.lesson.isPublished);
    if (!video.encryptionKey) throw new NotFoundException('Encryption key is not available');
    const key = await this.r2Storage.getObject(video.encryptionKey);
    response.setHeader('Content-Type', 'application/octet-stream');
    response.setHeader('Cache-Control', 'private, no-store');
    return response.send(key);
  }

  @Get('videos/:id')
  async streamVideo(@CurrentUser() user: any, @Param('id') id: string, @Res() response: Response) {
    const video = await this.prisma.lessonVideo.findFirst({
      where: { id, deletedAt: null },
      include: { lesson: true },
    });

    if (!video?.manifestKey) {
      throw new NotFoundException('Video not found');
    }

    await this.assertViewerAccess(user, video.lesson.courseId, video.lesson.isPublished);
    return response.redirect(302, await this.r2Storage.getPresignedDownloadUrl(video.manifestKey, 300));
  }

  private async findVideo(id: string) {
    const video = await this.prisma.lessonVideo.findFirst({
      where: { id, deletedAt: null },
      include: { lesson: { include: { chapter: true } } },
    });
    if (!video) throw new NotFoundException('Video not found');
    return video;
  }

  private async assertTeacherAccess(user: any, courseId: string) {
    if (user.role === 'ADMIN') return;
    const teacher = await this.prisma.teacher.findUnique({ where: { userId: user.id } });
    const membership = await this.prisma.courseTeacher.findFirst({
      where: { courseId, teacherId: teacher?.id, deletedAt: null },
    });
    if (!membership) throw new ForbiddenException('You can only upload to courses you manage');
  }

  private async assertViewerAccess(user: any, courseId: string, published: boolean) {
    if (!user) throw new ForbiddenException('Authentication required');
    if (user.role === 'ADMIN') return;
    if (user.role === 'TEACHER') return this.assertTeacherAccess(user, courseId);
    if (user.role !== 'STUDENT' || !published) throw new ForbiddenException('Video is not available');

    const access = await this.courseAccessService.canAccessCourse(user.id, courseId);
    if (!access.hasAccess) {
      throw new ForbiddenException(access.reason ?? 'You do not have access to this course');
    }
  }
}
