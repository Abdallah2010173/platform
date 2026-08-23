import { Controller, Get, Param, Post, Res, UploadedFile, UseInterceptors, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { createReadStream, existsSync, mkdirSync } from 'fs';
import { basename, extname, join } from 'path';
import type { Response } from 'express';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { PrismaService } from '../../../infrastructure/database/prisma.service';

const uploadDirectory = process.env.UPLOAD_DIR || join(process.cwd(), 'uploads', 'videos');
const allowedVideoTypes = new Set(['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime']);
const storage = diskStorage({
  destination: (_req, _file, callback) => { if (!existsSync(uploadDirectory)) mkdirSync(uploadDirectory, { recursive: true }); callback(null, uploadDirectory); },
  filename: (_req, file, callback) => callback(null, `${crypto.randomUUID()}${extname(file.originalname).toLowerCase()}`),
});

@ApiTags('Media') @ApiBearerAuth() @Controller('media')
export class MediaController {
  constructor(private readonly prisma: PrismaService) {}
  @Post('lessons/:lessonId/videos') @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { storage, limits: { fileSize: 1024 * 1024 * 1024 }, fileFilter: (_req, file, callback) => callback(null, allowedVideoTypes.has(file.mimetype)) }))
  async uploadVideo(@CurrentUser() user: any, @Param('lessonId') lessonId: string, @UploadedFile() file: any) {
    if (!file) throw new BadRequestException('Upload an MP4, WebM, OGG, or MOV video up to 1 GB');
    const lesson = await this.prisma.lesson.findFirst({ where: { id: lessonId, deletedAt: null } }); if (!lesson) throw new NotFoundException('Lesson not found');
    await this.assertTeacherAccess(user, lesson.courseId);
    const video = await this.prisma.lessonVideo.create({ data: { lessonId, title: basename(file.originalname, extname(file.originalname)), url: 'pending', source: 'UPLOAD', sizeBytes: BigInt(file.size), uploadId: file.filename } });
    return this.prisma.lessonVideo.update({ where: { id: video.id }, data: { url: `/media/videos/${video.id}` } });
  }
  @Get('videos/:id')
  async streamVideo(@CurrentUser() user: any, @Param('id') id: string, @Res() response: Response) {
    const video = await this.prisma.lessonVideo.findFirst({ where: { id, deletedAt: null }, include: { lesson: true } }); if (!video?.uploadId) throw new NotFoundException('Video not found');
    await this.assertViewerAccess(user, video.lesson.courseId, video.lesson.isPublished);
    const path = join(uploadDirectory, basename(video.uploadId)); if (!existsSync(path)) throw new NotFoundException('Video file is unavailable');
    response.setHeader('Content-Type', 'video/*'); return createReadStream(path).pipe(response);
  }
  private async assertTeacherAccess(user: any, courseId: string) { if (user.role === 'ADMIN') return; const teacher = await this.prisma.teacher.findUnique({ where: { userId: user.id } }); const membership = await this.prisma.courseTeacher.findFirst({ where: { courseId, teacherId: teacher?.id, deletedAt: null } }); if (!membership) throw new ForbiddenException('You can only upload to courses you manage'); }
  private async assertViewerAccess(user: any, courseId: string, published: boolean) { if (user.role === 'ADMIN') return; if (user.role === 'TEACHER') return this.assertTeacherAccess(user, courseId); if (user.role !== 'STUDENT' || !published) throw new ForbiddenException('Video is not available'); const student = await this.prisma.student.findUnique({ where: { userId: user.id } }); const enrolled = await this.prisma.courseStudent.findFirst({ where: { courseId, studentId: student?.id, status: 'ACTIVE', deletedAt: null } }); if (!enrolled) throw new ForbiddenException('You are not enrolled in this course'); }
}
