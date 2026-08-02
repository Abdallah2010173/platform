import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';
import * as crypto from 'crypto';
import { FileKind, StorageProvider, Upload } from '@platform/database';
import { PrismaService } from '../../../../infrastructure/database/prisma.service';
import { StudentHelper, AuthenticatedUser } from '../student.helper';

export interface UploadFileInput {
  fieldname?: string;
  originalname: string;
  encoding?: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

@Injectable()
export class StudentFileService {
  private readonly uploadDir: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly studentHelper: StudentHelper,
  ) {
    this.uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  private detectKind(mimeType: string): FileKind {
    if (mimeType.startsWith('image/')) return FileKind.IMAGE;
    if (mimeType.startsWith('video/')) return FileKind.VIDEO;
    if (mimeType.startsWith('audio/')) return FileKind.AUDIO;
    if (
      mimeType === 'application/pdf' ||
      mimeType.includes('document') ||
      mimeType.includes('text/') ||
      mimeType.includes('spreadsheet')
    ) {
      return FileKind.DOCUMENT;
    }
    if (mimeType.includes('zip') || mimeType.includes('compressed') || mimeType.includes('tar')) {
      return FileKind.ARCHIVE;
    }
    return FileKind.OTHER;
  }

  async uploadFile(
    user: AuthenticatedUser,
    file: UploadFileInput,
    dto: { folder?: string; isPublic?: boolean; metadata?: Record<string, unknown> },
  ): Promise<Record<string, any>> {
    await this.studentHelper.getStudentId(user);

    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const folder = dto.folder?.replace(/[^a-zA-Z0-9-_/]/g, '') || 'general';
    const storageKey = `${folder}/${Date.now()}-${crypto.randomBytes(8).toString('hex')}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const destPath = path.join(this.uploadDir, storageKey);
    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    fs.writeFileSync(destPath, file.buffer);

    const kind = this.detectKind(file.mimetype);
    const url = `/api/v1/files/${encodeURIComponent(storageKey)}`;

    const upload = await this.prisma.upload.create({
      data: {
        userId: user.id,
        fileName: path.basename(storageKey),
        originalName: file.originalname,
        mimeType: file.mimetype,
        sizeBytes: BigInt(file.size),
        kind,
        storageProvider: StorageProvider.LOCAL,
        storageKey,
        url,
        metadata: (dto.metadata as any) ?? undefined,
        isPublic: dto.isPublic ?? false,
      },
    });

    // Create type-specific metadata records
    if (kind === FileKind.IMAGE) {
      await this.prisma.image.create({
        data: { uploadId: upload.id, url: url! },
      });
    } else if (kind === FileKind.VIDEO) {
      await this.prisma.video.create({
        data: { uploadId: upload.id, playbackUrl: url },
      });
    } else if (kind === FileKind.DOCUMENT) {
      await this.prisma.document.create({
        data: { uploadId: upload.id },
      });
    }

    return this.mapUpload(upload);
  }

  private mapUpload(upload: {
    id: string;
    fileName: string;
    originalName: string;
    mimeType: string;
    sizeBytes: bigint;
    kind: FileKind;
    url: string | null;
    storageKey: string;
    isPublic: boolean;
    createdAt: Date;
  }): Record<string, any> {
    return {
      id: upload.id,
      fileName: upload.fileName,
      originalName: upload.originalName,
      mimeType: upload.mimeType,
      sizeBytes: Number(upload.sizeBytes),
      kind: upload.kind,
      url: upload.url,
      storageKey: upload.storageKey,
      isPublic: upload.isPublic,
      createdAt: upload.createdAt,
    };
  }

  async getMyFiles(user: AuthenticatedUser, page = 1, limit = 20, kind?: string) {
    await this.studentHelper.getStudentId(user);
    const skip = (page - 1) * limit;

    const where: Record<string, any> = {
      userId: user.id,
      deletedAt: null,
      ...(kind ? { kind: kind as FileKind } : {}),
    };

    const [files, total] = await Promise.all([
      this.prisma.upload.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.upload.count({ where }),
    ]);

    return {
      items: files.map((f) => this.mapUpload(f)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getFile(user: AuthenticatedUser, fileId: string): Promise<Record<string, any>> {
    await this.studentHelper.getStudentId(user);

    const upload = await this.prisma.upload.findFirst({
      where: {
        id: fileId,
        deletedAt: null,
        OR: [{ userId: user.id }, { isPublic: true }],
      },
    });

    if (!upload) {
      throw new NotFoundException('File not found');
    }

    return this.mapUpload(upload);
  }

  async downloadFile(user: AuthenticatedUser, fileId: string): Promise<Record<string, any>> {
    const file = await this.getFile(user, fileId);

    const upload = await this.prisma.upload.findUnique({
      where: { id: fileId },
    });
    if (!upload) {
      throw new NotFoundException('File not found');
    }

    const fullPath = path.join(this.uploadDir, upload.storageKey);
    if (!fs.existsSync(fullPath)) {
      throw new NotFoundException('File content missing on disk');
    }

    return {
      ...file,
      content: fs.readFileSync(fullPath),
      originalName: upload.originalName,
      mimeType: upload.mimeType,
    };
  }

  async deleteFile(user: AuthenticatedUser, fileId: string) {
    const upload = await this.prisma.upload.findFirst({
      where: { id: fileId, userId: user.id, deletedAt: null },
    });
    if (!upload) {
      throw new NotFoundException('File not found');
    }

    // Soft delete
    await this.prisma.upload.update({
      where: { id: fileId },
      data: { deletedAt: new Date() },
    });

    return { success: true };
  }

  async getPublicFile(storageKey: string): Promise<Record<string, any>> {
    const upload = await this.prisma.upload.findFirst({
      where: { storageKey, isPublic: true, deletedAt: null },
    });
    if (!upload) {
      throw new NotFoundException('File not found');
    }

    const fullPath = path.join(this.uploadDir, upload.storageKey);
    if (!fs.existsSync(fullPath)) {
      throw new NotFoundException('File content missing on disk');
    }

    return {
      content: fs.readFileSync(fullPath),
      mimeType: upload.mimeType,
      originalName: upload.originalName,
    };
  }

  async getFileCategories(user: AuthenticatedUser): Promise<Record<string, any>[]> {
    await this.studentHelper.getStudentId(user);
    const groups = await this.prisma.upload.groupBy({
      by: ['kind'],
      where: { userId: user.id, deletedAt: null },
      _count: { _all: true },
      _sum: { sizeBytes: true },
    });

    return groups.map((g) => ({
      kind: g.kind,
      count: g._count._all,
      totalBytes: Number(g._sum.sizeBytes ?? 0n),
    }));
  }

  async assertOwnership(user: AuthenticatedUser, uploadId: string): Promise<Upload> {
    const upload = await this.prisma.upload.findFirst({
      where: { id: uploadId, userId: user.id },
    });
    if (!upload) {
      throw new ForbiddenException('You do not have access to this file');
    }
    return upload;
  }
}
