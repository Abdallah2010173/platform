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
    this.bucketName = config.getOrThrow<string>('CLOUDFLARE_R2_BUCKET_NAME');
    this.publicUrl = config.get<string>('CLOUDFLARE_R2_PUBLIC_URL')?.replace(/\/+$/, '');
    this.client = new S3Client({
      region: 'auto',
      endpoint: config.getOrThrow<string>('CLOUDFLARE_R2_ENDPOINT'),
      credentials: {
        accessKeyId: config.getOrThrow<string>('CLOUDFLARE_R2_ACCESS_KEY_ID'),
        secretAccessKey: config.getOrThrow<string>('CLOUDFLARE_R2_SECRET_ACCESS_KEY'),
      },
    });
  }

  async getPresignedUploadUrl(fileName: string, contentType: string) {
    const safeName = path.basename(fileName).replace(/[^a-zA-Z0-9._-]/g, '_');
    if (!safeName || !contentType.trim()) {
      throw new BadRequestException('A file name and content type are required');
    }

    const fileKey = `uploads/${randomUUID()}-${safeName}`;
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: fileKey,
      ContentType: contentType,
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

  async deleteFile(fileKey: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: fileKey,
    }));
  }
}
