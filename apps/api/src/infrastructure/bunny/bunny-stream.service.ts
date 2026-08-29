import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'node:crypto';

export type BunnyUploadedVideo = {
  videoId: string;
  title: string;
  playbackUrl: string;
  thumbnailUrl?: string | null;
  durationSeconds?: number | null;
  resolution?: string | null;
  source?: string;
  status?: string;
};

@Injectable()
export class BunnyStreamService {
  private readonly logger = new Logger(BunnyStreamService.name);

  constructor(private readonly configService: ConfigService) {}

  private get libraryId(): string {
    const value = this.configService.get<string>('BUNNY_STREAM_LIBRARY_ID');
    if (!value) {
      throw new Error('BUNNY_STREAM_LIBRARY_ID is required. Add it to the server environment only.');
    }
    return value;
  }

  private get apiKey(): string {
    const value = this.configService.get<string>('BUNNY_STREAM_API_KEY');
    if (!value) {
      throw new Error('BUNNY_STREAM_API_KEY is required. It must never be exposed to the frontend.');
    }
    return value;
  }

  private get cdnHostname(): string {
    const value = this.configService.get<string>('BUNNY_STREAM_CDN_HOSTNAME');
    if (!value) {
      throw new Error('BUNNY_STREAM_CDN_HOSTNAME is required. Configure Bunny Stream CDN host here.');
    }
    return value.replace(/^https?:\/\//i, '').replace(/\/+$/, '');
  }

  private get apiBaseUrl(): string {
    return `https://video.bunnycdn.com/library/${this.libraryId}`;
  }

  async createVideo(title: string): Promise<{ videoId: string }> {
    const response = await fetch(`${this.apiBaseUrl}/videos`, {
      method: 'POST',
      headers: {
        AccessKey: this.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title }),
    });

    if (!response.ok) {
      const payload = await response.text();
      throw new Error(`Bunny Stream video creation failed (${response.status}): ${payload}`);
    }

    const data = (await response.json()) as { guid?: string; id?: string; videoId?: string };
    const videoId = data.guid ?? data.id ?? data.videoId;

    if (!videoId) {
      throw new Error('Bunny Stream did not return a valid video identifier.');
    }

    return { videoId };
  }

  async uploadVideoFile(videoId: string, file: Express.Multer.File): Promise<BunnyUploadedVideo> {
    const url = `${this.apiBaseUrl}/videos/${videoId}`;
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        AccessKey: this.apiKey,
        'Content-Type': file.mimetype || 'application/octet-stream',
      },
      body: file.buffer,
    });

    if (!response.ok) {
      const payload = await response.text();
      throw new Error(`Bunny Stream upload failed (${response.status}): ${payload}`);
    }

    const video = await this.getVideo(videoId);
    return {
      videoId,
      title: video.title ?? file.originalname,
      playbackUrl: this.getPlaybackUrl(videoId),
      thumbnailUrl: video.thumbnailUrl ?? null,
      durationSeconds: video.length ?? null,
      resolution: video.resolution ?? null,
      source: 'BUNNY',
      status: video.status ?? 'READY',
    };
  }

  async getVideo(videoId: string): Promise<Record<string, any>> {
    const response = await fetch(`${this.apiBaseUrl}/videos/${videoId}`, {
      method: 'GET',
      headers: { AccessKey: this.apiKey },
    });

    if (!response.ok) {
      const payload = await response.text();
      throw new Error(`Bunny Stream fetch failed (${response.status}): ${payload}`);
    }

    return (await response.json()) as Record<string, any>;
  }

  async deleteVideo(videoId: string): Promise<void> {
    const response = await fetch(`${this.apiBaseUrl}/videos/${videoId}`, {
      method: 'DELETE',
      headers: { AccessKey: this.apiKey },
    });

    if (!response.ok && response.status !== 404) {
      const payload = await response.text();
      throw new Error(`Bunny Stream delete failed (${response.status}): ${payload}`);
    }
  }

  getPlaybackUrl(videoId: string): string {
    return `https://${this.cdnHostname}/${videoId}/play`;
  }

  getSignedWebhookSecret(): string | undefined {
    return this.configService.get<string>('BUNNY_STREAM_WEBHOOK_SECRET');
  }

  verifyWebhookSignature(rawBody: string, providedSignature?: string): boolean {
    const secret = this.getSignedWebhookSecret();
    if (!secret || !providedSignature) {
      return false;
    }

    const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
    const candidates = new Set([
      providedSignature,
      providedSignature.toLowerCase(),
      providedSignature.toUpperCase(),
      `sha256=${expected}`,
      expected,
    ]);

    return candidates.has(expected) || candidates.has(`sha256=${expected}`);
  }
}
