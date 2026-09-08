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
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { VideoSource } from '@prisma/client';
import { diskStorage } from 'multer';
import { mkdirSync } from 'node:fs';
import { unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { posix } from 'node:path';
import { Readable } from 'node:stream';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { R2StorageService } from '../../../infrastructure/storage/r2-storage.service';
import { CourseAccessService } from '../courses/services/course-access.service';

const allowedVideoTypes = new Set(['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime']);

@ApiTags('Media')
@ApiBearerAuth()
@Controller('media')
export class MediaController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly courseAccessService: CourseAccessService,
    private readonly r2Storage: R2StorageService,
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
    console.log(`[Media] Stored original video in R2: ${source.fileKey}`);
    await unlink(file.path).catch(() => undefined);
    const record = await this.prisma.lessonVideo.create({
      data: {
        lessonId,
        title: file.originalname || `lesson-${lessonId}`,
        description: 'Uploaded video',
        url: source.fileKey,
        source: VideoSource.UPLOAD,
        sizeBytes: file.size ? BigInt(file.size) : undefined,
        quality: 'AUTO',
        transcodingStatus: 'READY',
        sourceKey: source.fileKey,
      },
    });
    return { id: record.id, status: record.transcodingStatus, sourceKey: source.fileKey };
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
  async manifestUrl(@CurrentUser() user: any, @Param('id') id: string, @Req() request: Request) {
    const video = await this.findVideo(id);
    await this.assertViewerAccess(user, video.lesson.courseId, video.lesson.isPublished);
    if (video.transcodingStatus !== 'READY' || !video.manifestKey) {
      throw new NotFoundException('Video is still being processed');
    }
    const apiUrl = this.publicApiUrl(request);
    return { url: `${apiUrl.replace(/\/+$/, '')}/api/v1/media/videos/${id}/manifest`, expiresIn: 300 };
  }

  @Get('videos/:id/manifest')
  async manifest(@CurrentUser() user: any, @Param('id') id: string, @Req() request: Request, @Res() response: Response) {
    const video = await this.findVideo(id);
    await this.assertViewerAccess(user, video.lesson.courseId, video.lesson.isPublished);
    if (video.transcodingStatus !== 'READY' || !video.manifestKey) {
      throw new NotFoundException('Video is still being processed');
    }

    const manifest = (await this.r2Storage.getObject(video.manifestKey)).toString('utf8');
    const rewritten = this.rewriteHlsManifest(manifest, id, 'master.m3u8');
    this.setVideoCorsHeaders(request, response);
    response.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
    response.setHeader('Cache-Control', 'private, no-store');
    return response.send(rewritten);
  }

  @Get('videos/:id/hls/*path')
  async hlsFile(@CurrentUser() user: any, @Param('id') id: string, @Param('path') objectPath: string, @Req() request: Request, @Res() response: Response) {
    const video = await this.findVideo(id);
    await this.assertViewerAccess(user, video.lesson.courseId, video.lesson.isPublished);
    const safePath = objectPath.replace(/^\/+/, '');
    if (!safePath || safePath.includes('..')) throw new NotFoundException('HLS file not found');

    const key = `videos/${id}/hls/${safePath}`;
    const content = await this.r2Storage.getObject(key);
    if (safePath.endsWith('.m3u8')) {
      const rewritten = this.rewriteHlsManifest(content.toString('utf8'), id, safePath);
      this.setVideoCorsHeaders(request, response);
      response.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
      return response.send(rewritten);
    }
    this.setVideoCorsHeaders(request, response);
    response.setHeader('Content-Type', safePath.endsWith('.ts') ? 'video/mp2t' : 'application/octet-stream');
    return response.send(content);
  }

  @Get('videos/:id/key')
  async encryptionKey(@CurrentUser() user: any, @Param('id') id: string, @Req() request: Request, @Res() response: Response) {
    const video = await this.findVideo(id);
    await this.assertViewerAccess(user, video.lesson.courseId, video.lesson.isPublished);
    if (!video.encryptionKey) throw new NotFoundException('Encryption key is not available');
    const key = await this.r2Storage.getObject(video.encryptionKey);
    this.setVideoCorsHeaders(request, response);
    response.setHeader('Content-Type', 'application/octet-stream');
    response.setHeader('Cache-Control', 'private, no-store');
    return response.send(key);
  }

  @Get('videos/:id/source-url')
  async sourceUrl(@CurrentUser() user: any, @Param('id') id: string, @Req() request: Request) {
    const video = await this.findVideo(id);
    await this.assertViewerAccess(user, video.lesson.courseId, video.lesson.isPublished);
    if (!video.sourceKey) throw new NotFoundException('Original video is not available');
    return { url: `${this.publicApiUrl(request)}/api/v1/media/videos/${id}/source`, expiresIn: 300 };
  }

  @Get('videos/:id/source')
  async source(@CurrentUser() user: any, @Param('id') id: string, @Req() request: Request, @Res() response: Response) {
    const video = await this.findVideo(id);
    await this.assertViewerAccess(user, video.lesson.courseId, video.lesson.isPublished);
    if (!video.sourceKey) throw new NotFoundException('Original video is not available');

    const result = await this.r2Storage.getObjectStream(video.sourceKey, request.headers.range);
    if (!result.Body) throw new NotFoundException('Original video is not available');
    this.setVideoCorsHeaders(request, response);
    response.setHeader('Content-Type', 'video/mp4');
    response.setHeader('Accept-Ranges', 'bytes');
    if (result.ContentLength != null) response.setHeader('Content-Length', String(result.ContentLength));
    if (result.ContentRange) {
      response.status(206);
      response.setHeader('Content-Range', result.ContentRange);
    }
    return (result.Body as Readable).pipe(response);
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

  private rewriteHlsManifest(manifest: string, videoId: string, currentPath: string): string {
    const currentDirectory = posix.dirname(currentPath);
    const hlsUrl = (relativePath: string) => {
      const target = posix.normalize(posix.join(currentDirectory, relativePath));
      return `/api/v1/media/videos/${videoId}/hls/${encodeURI(target)}`;
    };

    return manifest
      .split(/\r?\n/)
      .map((line) => {
        if (line.startsWith('#EXT-X-KEY:') && line.includes('URI="')) {
          return line.replace(/URI="([^"]+)"/, (_match, uri: string) => {
            const keyId = uri.match(/\/media\/videos\/([^/]+)\/key/)?.[1] ?? videoId;
            return `URI="/api/v1/media/videos/${keyId}/key"`;
          });
        }
        if (!line || line.startsWith('#')) return line;
        return hlsUrl(line.trim());
      })
      .join('\n');
  }

  private publicApiUrl(request: Request): string {
    const configured = process.env.API_PUBLIC_URL?.trim().replace(/\/+$/, '');
    if (configured && !configured.includes('localhost')) return configured;
    const forwardedProto = request.headers['x-forwarded-proto'];
    const protocol = typeof forwardedProto === 'string' ? forwardedProto.split(',')[0] : request.protocol;
    return `${protocol}://${request.get('host')}`;
  }

  private setVideoCorsHeaders(request: Request, response: Response): void {
    const origin = request.headers.origin;
    if (origin === 'https://globalmathematics.online' || origin === 'https://www.globalmathematics.online') {
      response.setHeader('Access-Control-Allow-Origin', origin);
      response.setHeader('Access-Control-Allow-Credentials', 'true');
      response.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
      response.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
      response.setHeader('Vary', 'Origin');
    }
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
