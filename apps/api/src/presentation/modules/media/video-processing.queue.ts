import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job, Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import { VideoProcessingJob, VIDEO_PROCESSING_JOB, VIDEO_PROCESSING_QUEUE } from './video-processing.constants';
import { VideoProcessingService } from './video-processing.service';

@Injectable()
export class VideoProcessingQueue implements OnModuleDestroy {
  private readonly connection: IORedis;
  private readonly queue: Queue<VideoProcessingJob>;
  private readonly worker: Worker<VideoProcessingJob>;

  constructor(config: ConfigService, processor: VideoProcessingService) {
    this.connection = new IORedis(config.get<string>('REDIS_URL') ?? 'redis://localhost:6379', {
      maxRetriesPerRequest: null,
    });
    this.queue = new Queue<VideoProcessingJob>(VIDEO_PROCESSING_QUEUE, { connection: this.connection });
    this.worker = new Worker<VideoProcessingJob>(
      VIDEO_PROCESSING_QUEUE,
      async (job: Job<VideoProcessingJob>) => processor.process(job.data),
      { connection: this.connection, concurrency: 1 },
    );
  }

  async enqueue(data: VideoProcessingJob) {
    return this.queue.add(VIDEO_PROCESSING_JOB, data, {
      attempts: 2,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: 100,
      removeOnFail: 100,
    });
  }

  async onModuleDestroy() {
    await this.worker.close();
    await this.queue.close();
    await this.connection.quit();
  }
}