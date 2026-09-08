export const VIDEO_PROCESSING_QUEUE = 'video-processing';
export const VIDEO_PROCESSING_JOB = 'transcode-hls';

export type VideoProcessingJob = {
  videoId: string;
  lessonId: string;
  sourcePath: string;
  originalName: string;
  contentType: string;
};