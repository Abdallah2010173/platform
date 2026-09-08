import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'node:crypto';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { R2StorageService } from '../../../infrastructure/storage/r2-storage.service';
import { VideoProcessingJob } from './video-processing.constants';

type Variant = { name: string; width: number; height: number; bandwidth: number };

@Injectable()
export class VideoProcessingService {
  private readonly logger = new Logger(VideoProcessingService.name);
  private readonly variants: Variant[] = [
    { name: '1080p', width: 1920, height: 1080, bandwidth: 5500000 },
    { name: '720p', width: 1280, height: 720, bandwidth: 3000000 },
    { name: '480p', width: 854, height: 480, bandwidth: 1400000 },
  ];

  constructor(
    private readonly prisma: PrismaService,
    private readonly r2: R2StorageService,
    private readonly config: ConfigService,
  ) {}

  async process(job: VideoProcessingJob): Promise<void> {
    const workDir = join(process.cwd(), 'uploads', 'video-processing', job.videoId);
    const outputDir = join(workDir, 'hls');
    const keyPath = join(workDir, 'encryption.key');
    const keyInfoPath = join(workDir, 'key-info.txt');

    try {
      await mkdir(outputDir, { recursive: true });
      const encryptionKey = randomBytes(16);
      await writeFile(keyPath, encryptionKey);
      const apiUrl = this.config.get<string>('API_PUBLIC_URL') ?? `http://localhost:${this.config.get<number>('PORT', 4000)}`;
      const keyUri = `${apiUrl.replace(/\/+$/, '')}/api/v1/media/videos/${job.videoId}/key`;
      await writeFile(keyInfoPath, `${keyUri}\n${keyPath}\n`);

      await this.runFfmpeg(job.sourcePath, outputDir, keyInfoPath);
      const files = await this.collectFiles(outputDir);
      const prefix = `videos/${job.videoId}/hls`;
      for (const filePath of files) {
        const relative = filePath.slice(outputDir.length + 1).replaceAll('\\', '/');
        const key = `${prefix}/${relative}`;
        const contentType = relative.endsWith('.m3u8')
          ? 'application/vnd.apple.mpegurl'
          : relative.endsWith('.ts')
            ? 'video/mp2t'
            : 'application/octet-stream';
        await this.r2.putObject(key, await readFile(filePath), contentType);
      }

      const manifestKey = `${prefix}/master.m3u8`;
      const encryptionKeyObject = `${prefix}/encryption.key`;
      await this.r2.putObject(encryptionKeyObject, encryptionKey, 'application/octet-stream');
      await this.prisma.lessonVideo.update({
        where: { id: job.videoId },
        data: {
          url: manifestKey,
          manifestKey,
          encryptionKey: encryptionKeyObject,
          transcodingStatus: 'READY',
          processingError: null,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Video processing failed';
      this.logger.error(`Video ${job.videoId} failed: ${message}`);
      await this.prisma.lessonVideo.update({
        where: { id: job.videoId },
        data: { transcodingStatus: 'FAILED', processingError: message },
      }).catch(() => undefined);
      throw error;
    } finally {
      await rm(workDir, { recursive: true, force: true });
      await rm(job.sourcePath, { force: true }).catch(() => undefined);
    }
  }

  private runFfmpeg(sourcePath: string, outputDir: string, keyInfoPath: string): Promise<void> {
    const filter = [
      '[0:v]split=3[v0][v1][v2]',
      ...this.variants.map((variant, index) =>
        `[v${index}]scale=w=${variant.width}:h=${variant.height}:force_original_aspect_ratio=decrease,pad=${variant.width}:${variant.height}:(ow-iw)/2:(oh-ih)/2[v${index}out]`,
      ),
    ].join(';');
    const args = [
      '-y', '-i', sourcePath, '-filter_complex', filter,
      ...this.variants.flatMap((_, index) => ['-map', `[v${index}out]`, '-map', '0:a:0?']),
      '-c:v', 'libx264', '-preset', 'veryfast', '-profile:v', 'main', '-crf', '22',
      '-c:a', 'aac', '-ar', '48000', '-b:a', '128k',
      '-f', 'hls', '-hls_time', '6', '-hls_playlist_type', 'vod',
      '-hls_flags', 'independent_segments', '-hls_key_info_file', keyInfoPath,
      '-hls_segment_filename', join(outputDir, '%v', 'segment_%05d.ts'),
      '-master_pl_name', 'master.m3u8', '-var_stream_map', 'v:0,a:0 v:1,a:1 v:2,a:2',
      join(outputDir, '%v', 'index.m3u8'),
    ];
    return new Promise((resolve, reject) => {
      const process = spawn(this.config.get<string>('FFMPEG_PATH', 'ffmpeg'), args, { stdio: ['ignore', 'ignore', 'pipe'] });
      let stderr = '';
      process.stderr.on('data', (chunk: Buffer) => { stderr += chunk.toString(); });
      process.once('error', (error) => reject(new Error(`FFmpeg is unavailable: ${error.message}`)));
      process.once('close', (code) => code === 0 ? resolve() : reject(new Error(`FFmpeg exited with ${code}: ${stderr.slice(-2000)}`)));
    });
  }

  private async collectFiles(directory: string): Promise<string[]> {
    const entries = await (await import('node:fs/promises')).readdir(directory, { withFileTypes: true });
    const files: string[] = [];
    for (const entry of entries) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) files.push(...await this.collectFiles(path));
      else files.push(path);
    }
    return files;
  }
}