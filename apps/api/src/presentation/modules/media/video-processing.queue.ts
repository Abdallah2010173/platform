import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job, Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import { randomUUID } from 'node:crypto';
import { VideoProcessingJob, VIDEO_PROCESSING_JOB, VIDEO_PROCESSING_QUEUE } from './video-processing.constants';
import { VideoProcessingService } from './video-processing.service';

@Injectable()
export class VideoProcessingQueue implements OnModuleDestroy {
  private readonly connection?: IORedis;
  private readonly queue?: Queue<VideoProcessingJob>;
  private readonly worker?: Worker<VideoProcessingJob>;

  constructor(config: ConfigService, processor: VideoProcessingService) {
    const redisUrl = config.get<string>('REDIS_URL')?.trim();
    if (!redisUrl) {
      console.warn('[VideoProcessingQueue] REDIS_URL is not configured; using direct video processing');
      this.processor = processor;
      return;
    }

    this.connection = new IORedis(redisUrl, {
      maxRetriesPerRequest: null,
    });
    this.connection.on('error', (error) => {
      console.error(`[VideoProcessingQueue] Redis error: ${error.message}`);
    });
    this.queue = new Queue<VideoProcessingJob>(VIDEO_PROCESSING_QUEUE, { connection: this.connection });
    this.worker = new Worker<VideoProcessingJob>(
      VIDEO_PROCESSING_QUEUE,
      async (job: Job<VideoProcessingJob>) => processor.process(job.data),
      { connection: this.connection, concurrency: 1 },
    );
    this.worker.on('completed', (job) => {
      console.log(`[VideoProcessingQueue] Completed video ${job.data.videoId}`);
    });
    this.worker.on('failed', (job, error) => {
      console.error(`[VideoProcessingQueue] Failed video ${job?.data.videoId ?? 'unknown'}: ${error.message}`);
    });
    this.processor = processor;
  }

  private readonly processor: VideoProcessingService;

  async enqueue(data: VideoProcessingJob) {
    if (!this.queue) {
      const jobId = randomUUID();
      void this.processor.process(data).then(
        () => console.log(`[VideoProcessingQueue] Completed direct video ${data.videoId}`),
        (error: unknown) => console.error(`[VideoProcessingQueue] Failed direct video ${data.videoId}: ${error instanceof Error ? error.message : 'unknown error'}`),
      );
      return { id: jobId };
    }

    return this.queue.add(VIDEO_PROCESSING_JOB, data, {
      attempts: 2,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: 100,
      removeOnFail: 100,
    });
  }

  async onModuleDestroy() {
    await this.worker?.close();
    await this.queue?.close();
    await this.connection?.quit();
  }
}