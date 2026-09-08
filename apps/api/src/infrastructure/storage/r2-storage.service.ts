import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import * as path from 'node:path';

@Injectable()
export class R2StorageService {
  private readonly client: S3Client;
  private readonly bucketName: string;
  private readonly publicUrl?: string;

  constructor(config: ConfigService) {
    const endpoint = config.getOrThrow<string>('CLOUDFLARE_R2_ENDPOINT').trim().replace(/\/+$/, '');
    const accessKeyId = config.getOrThrow<string>('CLOUDFLARE_R2_ACCESS_KEY_ID').trim();
    const secretAccessKey = config.getOrThrow<string>('CLOUDFLARE_R2_SECRET_ACCESS_KEY').trim();
    this.bucketName = config.getOrThrow<string>('CLOUDFLARE_R2_BUCKET_NAME').trim();
    this.publicUrl = config.get<string>('CLOUDFLARE_R2_PUBLIC_URL')?.trim().replace(/\/+$/, '');
    this.client = new S3Client({
      region: 'auto',
      endpoint,
      requestChecksumCalculation: 'WHEN_REQUIRED',
      responseChecksumValidation: 'WHEN_REQUIRED',
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  async getPresignedUploadUrl(fileName: string, contentType: string, resourceType?: 'IMAGE' | 'VIDEO' | 'FILE') {
    const safeName = path.basename(fileName).replace(/[^a-zA-Z0-9._-]/g, '_');
    const normalizedType = contentType.trim().toLowerCase();
    if (!safeName || !normalizedType) {
      throw new BadRequestException('A file name and content type are required');
    }

    const detectedType = normalizedType.startsWith('image/') ? 'IMAGE' : normalizedType.startsWith('video/') ? 'VIDEO' : 'FILE';
    if (resourceType && resourceType !== detectedType) {
      throw new BadRequestException(`The selected file must be a ${resourceType.toLowerCase()}`);
    }
    const folder = detectedType === 'IMAGE' ? 'images' : detectedType === 'VIDEO' ? 'videos' : 'files';
    const fileKey = `uploads/${folder}/${randomUUID()}-${safeName}`;
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: fileKey,
      ContentType: normalizedType,
    });
    const uploadUrl = await getSignedUrl(this.client, command, { expiresIn: 900 });
    const publicUrl = this.publicUrl
      ? `${this.publicUrl}/${fileKey}`
      : await getSignedUrl(this.client, new GetObjectCommand({ Bucket: this.bucketName, Key: fileKey }), { expiresIn: 604800 });

    return {
      uploadUrl,
      fileKey,
      publicUrl,
    };
  }

  async uploadBuffer(fileName: string, contentType: string, body: Buffer) {
    const safeName = path.basename(fileName).replace(/[^a-zA-Z0-9._-]/g, '_');
    const normalizedType = contentType.trim().toLowerCase();
    if (!safeName || !normalizedType || !body.length) {
      throw new BadRequestException('A non-empty file name, content type, and file are required');
    }

    const folder = normalizedType.startsWith('image/')
      ? 'images'
      : normalizedType.startsWith('video/')
        ? 'videos'
        : 'files';
    const fileKey = `uploads/${folder}/${randomUUID()}-${safeName}`;
    await this.client.send(new PutObjectCommand({
      Bucket: this.bucketName,
      Key: fileKey,
      Body: body,
      ContentType: normalizedType,
    }));

    const publicUrl = this.publicUrl
      ? `${this.publicUrl}/${fileKey}`
      : await getSignedUrl(this.client, new GetObjectCommand({ Bucket: this.bucketName, Key: fileKey }), { expiresIn: 604800 });

    return { fileKey, publicUrl };
  }

  async deleteFile(fileKey: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: fileKey,
    }));
  }

  async putObject(fileKey: string, body: Buffer, contentType: string): Promise<void> {
    await this.client.send(new PutObjectCommand({
      Bucket: this.bucketName,
      Key: fileKey,
      Body: body,
      ContentType: contentType,
    }));
  }

  async getObject(fileKey: string): Promise<Buffer> {
    const response = await this.client.send(new GetObjectCommand({
      Bucket: this.bucketName,
      Key: fileKey,
    }));
    if (!response.Body) throw new BadRequestException('Object body is empty');
    return Buffer.from(await response.Body.transformToByteArray());
  }

  async getPresignedDownloadUrl(fileKey: string, expiresIn = 300): Promise<string> {
    return getSignedUrl(this.client, new GetObjectCommand({ Bucket: this.bucketName, Key: fileKey }), { expiresIn });
  }
}
