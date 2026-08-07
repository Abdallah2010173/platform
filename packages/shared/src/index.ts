export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT',
  MODERATOR = 'MODERATOR',
}

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  [UserRole.SUPER_ADMIN]: 100,
  [UserRole.ADMIN]: 80,
  [UserRole.MODERATOR]: 60,
  [UserRole.TEACHER]: 40,
  [UserRole.STUDENT]: 20,
};

export const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.SUPER_ADMIN]: 'Super Admin',
  [UserRole.ADMIN]: 'Admin',
  [UserRole.TEACHER]: 'Teacher',
  [UserRole.STUDENT]: 'Student',
  [UserRole.MODERATOR]: 'Moderator',
};

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const API_ROUTES = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
    ME: '/auth/me',
    VERIFY_EMAIL: '/auth/verify-email',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    GOOGLE: '/auth/google',
    GOOGLE_CALLBACK: '/auth/google/callback',
    GOOGLE_EXCHANGE: '/auth/google/exchange',
  },
  USERS: '/users',
  HEALTH: '/health',
  CHAPTERS: '/chapters',
  LESSONS: '/lessons',
  MEDIA: '/media',
  VIDEOS: '/media/videos',
  RESOURCES: '/resources',
  ENROLLMENTS: '/enrollments',
  PROGRESS: '/progress',
} as const;

export const ENROLLMENT_STATUS = {
  ACTIVE: 'ACTIVE',
  COMPLETED: 'COMPLETED',
  DROPPED: 'DROPPED',
  PAUSED: 'PAUSED',
  CANCELED: 'CANCELED',
} as const;

export type EnrollmentStatusValue = (typeof ENROLLMENT_STATUS)[keyof typeof ENROLLMENT_STATUS];

export const ENROLLMENT_STATUS_LABELS: Record<EnrollmentStatusValue, string> = {
  [ENROLLMENT_STATUS.ACTIVE]: 'Active',
  [ENROLLMENT_STATUS.COMPLETED]: 'Completed',
  [ENROLLMENT_STATUS.DROPPED]: 'Dropped',
  [ENROLLMENT_STATUS.PAUSED]: 'Paused',
  [ENROLLMENT_STATUS.CANCELED]: 'Canceled',
};

export const CHAPTER_STATUS = {
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED',
  ARCHIVED: 'ARCHIVED',
  HIDDEN: 'HIDDEN',
} as const;

export type ChapterStatusValue = (typeof CHAPTER_STATUS)[keyof typeof CHAPTER_STATUS];

export const CHAPTER_STATUS_LABELS: Record<ChapterStatusValue, string> = {
  [CHAPTER_STATUS.DRAFT]: 'Draft',
  [CHAPTER_STATUS.PUBLISHED]: 'Published',
  [CHAPTER_STATUS.ARCHIVED]: 'Archived',
  [CHAPTER_STATUS.HIDDEN]: 'Hidden',
};

export const LESSON_STATUS = {
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED',
  ARCHIVED: 'ARCHIVED',
  HIDDEN: 'HIDDEN',
} as const;

export type LessonStatusValue = (typeof LESSON_STATUS)[keyof typeof LESSON_STATUS];

export const LESSON_STATUS_LABELS: Record<LessonStatusValue, string> = {
  [LESSON_STATUS.DRAFT]: 'Draft',
  [LESSON_STATUS.PUBLISHED]: 'Published',
  [LESSON_STATUS.ARCHIVED]: 'Archived',
  [LESSON_STATUS.HIDDEN]: 'Hidden',
};

export const LESSON_TYPES = {
  VIDEO: 'VIDEO',
  PDF: 'PDF',
  TEXT: 'TEXT',
  QUIZ: 'QUIZ',
  ASSIGNMENT: 'ASSIGNMENT',
  LIVE: 'LIVE',
} as const;

export type LessonTypeValue = (typeof LESSON_TYPES)[keyof typeof LESSON_TYPES];

export const LESSON_TYPE_LABELS: Record<LessonTypeValue, string> = {
  [LESSON_TYPES.VIDEO]: 'Video',
  [LESSON_TYPES.PDF]: 'PDF',
  [LESSON_TYPES.TEXT]: 'Text',
  [LESSON_TYPES.QUIZ]: 'Quiz',
  [LESSON_TYPES.ASSIGNMENT]: 'Assignment',
  [LESSON_TYPES.LIVE]: 'Live Class',
};

export const VIDEO_SOURCES = {
  UPLOAD: 'UPLOAD',
  HLS: 'HLS',
  YOUTUBE: 'YOUTUBE',
  VIMEO: 'VIMEO',
  BUNNY: 'BUNNY',
  EMBED: 'EMBED',
} as const;

export type VideoSourceValue = (typeof VIDEO_SOURCES)[keyof typeof VIDEO_SOURCES];

export const VIDEO_SOURCE_LABELS: Record<VideoSourceValue, string> = {
  [VIDEO_SOURCES.UPLOAD]: 'MP4 Upload',
  [VIDEO_SOURCES.HLS]: 'HLS Streaming',
  [VIDEO_SOURCES.YOUTUBE]: 'YouTube',
  [VIDEO_SOURCES.VIMEO]: 'Vimeo',
  [VIDEO_SOURCES.BUNNY]: 'Bunny Stream',
  [VIDEO_SOURCES.EMBED]: 'Embedded',
};
