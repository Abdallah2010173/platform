import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'node:crypto';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { R2StorageService } from '../../../infrastructure/storage/r2-storage.service';
import { VideoProcessingJob } from './video-processing.constants';

@Injectable()
export class VideoProcessingService {
  private readonly logger = new Logger(VideoProcessingService.name);

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
      await mkdir(join(outputDir, '0'), { recursive: true });
      const encryptionKey = randomBytes(16);
      await writeFile(keyPath, encryptionKey);
      const apiUrl = this.config.get<string>('API_PUBLIC_URL') ?? `http://localhost:${this.config.get<number>('PORT', 4000)}`;
      const keyUri = `${apiUrl.replace(/\/+$/, '')}/api/v1/media/videos/${job.videoId}/key`;
      await writeFile(keyInfoPath, `${keyUri}\n${keyPath}\n`);

      const hasAudio = await this.hasAudioStream(job.sourcePath);
      await this.runFfmpeg(job.sourcePath, outputDir, keyInfoPath, hasAudio);
      await writeFile(
        join(outputDir, 'master.m3u8'),
        '#EXTM3U\n#EXT-X-VERSION:3\n#EXT-X-STREAM-INF:BANDWIDTH=3000000,RESOLUTION=1280x720\n0/index.m3u8\n',
      );
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

  private runFfmpeg(sourcePath: string, outputDir: string, keyInfoPath: string, hasAudio: boolean): Promise<void> {
    const filter = 'scale=w=1280:h=720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2';
    const args = [
      '-y', '-i', sourcePath, '-vf', filter,
      '-map', '0:v:0',
      ...(hasAudio ? ['-map', '0:a:0'] : []),
      '-c:v', 'libx264', '-preset', 'veryfast', '-profile:v', 'main', '-crf', '22',
      ...(hasAudio ? ['-c:a', 'aac', '-ar', '48000', '-b:a', '128k'] : []),
      '-f', 'hls', '-hls_time', '6', '-hls_playlist_type', 'vod',
      '-hls_flags', 'independent_segments', '-hls_key_info_file', keyInfoPath,
      '-hls_segment_filename', join(outputDir, '0', 'segment_%05d.ts'),
      join(outputDir, '0', 'index.m3u8'),
    ];
    return new Promise((resolve, reject) => {
      const process = spawn(this.config.get<string>('FFMPEG_PATH', 'ffmpeg'), args, { stdio: ['ignore', 'ignore', 'pipe'] });
      let stderr = '';
      process.stderr.on('data', (chunk: Buffer) => { stderr += chunk.toString(); });
      process.once('error', (error) => reject(new Error(`FFmpeg is unavailable: ${error.message}`)));
      process.once('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`FFmpeg exited with ${code}: ${stderr.trim().slice(-4000)}`));
      });
    });
  }

  private hasAudioStream(sourcePath: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const probe = spawn(this.config.get<string>('FFPROBE_PATH', 'ffprobe'), ['-v', 'error', '-select_streams', 'a:0', '-show_entries', 'stream=index', '-of', 'csv=p=0', sourcePath], {
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      let output = '';
      let errorOutput = '';
      probe.stdout.on('data', (chunk: Buffer) => { output += chunk.toString(); });
      probe.stderr.on('data', (chunk: Buffer) => { errorOutput += chunk.toString(); });
      probe.once('error', (error) => reject(new Error(`FFprobe is unavailable: ${error.message}`)));
      probe.once('close', (code) => {
        if (code !== 0) reject(new Error(`FFprobe exited with ${code}: ${errorOutput.slice(-1000)}`));
        else resolve(output.trim().length > 0);
      });
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