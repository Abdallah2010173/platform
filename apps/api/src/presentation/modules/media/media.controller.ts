import {
  Controller,
  Get,
  Param,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  Req,
  Headers,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response, Request } from 'express';
import { VideoSource } from '@prisma/client';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { BunnyStreamService } from '../../../infrastructure/bunny/bunny-stream.service';
import { CourseAccessService } from '../courses/services/course-access.service';

const allowedVideoTypes = new Set(['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime']);

@ApiTags('Media')
@ApiBearerAuth()
@Controller('media')
export class MediaController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly courseAccessService: CourseAccessService,
    private readonly bunnyStreamService: BunnyStreamService,
  ) {}

  @Post('lessons/:lessonId/videos')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
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

    const created = await this.bunnyStreamService.createVideo(file.originalname || `lesson-${lessonId}`);
    const uploaded = await this.bunnyStreamService.uploadVideoFile(created.videoId, file);

    const record = await this.prisma.lessonVideo.create({
      data: {
        lessonId,
        title: uploaded.title,
        description: `Bunny Stream upload: ${uploaded.title}`,
        url: uploaded.playbackUrl,
        source: VideoSource.BUNNY,
        durationSeconds: uploaded.durationSeconds ?? null,
        thumbnailUrl: uploaded.thumbnailUrl ?? undefined,
        sizeBytes: file.size ? BigInt(file.size) : undefined,
        resolution: uploaded.resolution ?? undefined,
        quality: 'AUTO',
        uploadId: uploaded.videoId,
        transcodingStatus: uploaded.status ?? 'READY',
      },
    });

    return record;
  }

  @Get('videos/:id')
  async streamVideo(@CurrentUser() user: any, @Param('id') id: string, @Res() response: Response) {
    const video = await this.prisma.lessonVideo.findFirst({
      where: { id, deletedAt: null },
      include: { lesson: true },
    });

    if (!video?.uploadId) {
      throw new NotFoundException('Video not found');
    }

    await this.assertViewerAccess(user, video.lesson.courseId, video.lesson.isPublished);
    return response.redirect(302, this.bunnyStreamService.getPlaybackUrl(video.uploadId));
  }

  @Post('webhooks/bunny')
  @ApiOperation({ summary: 'Bunny Stream webhook endpoint' })
  async bunnyWebhook(
    @Req() req: Request,
    @Body() body: Record<string, any>,
    @Headers('x-bunny-signature') signature: string,
    @Headers('x-bunny-event') eventName: string,
  ) {
    const rawBody = (req as any).rawBody ? String((req as any).rawBody) : JSON.stringify(body ?? {});

    if (!this.bunnyStreamService.verifyWebhookSignature(rawBody, signature)) {
      throw new ForbiddenException('Invalid Bunny Stream webhook signature');
    }

    const videoId = body?.videoId ?? body?.video?.id ?? body?.guid ?? body?.Id;
    const status = body?.status ?? body?.video?.status ?? eventName ?? 'UNKNOWN';

    if (videoId) {
      await this.prisma.lessonVideo.updateMany({
        where: { uploadId: String(videoId) },
        data: {
          transcodingStatus: String(status),
        },
      });
    }

    return { success: true };
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
