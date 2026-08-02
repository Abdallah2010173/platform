import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  IsNumber,
  IsArray,
  Min,
  Max,
  MinLength,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  CourseLevel,
  CourseStatus,
  CourseVisibility,
  LessonType,
  VideoSource,
  VideoQuality,
  CategoryStatus,
  CategoryVisibility,
  SubjectStatus,
  ChapterStatus,
  LessonStatus,
} from '@prisma/client';

// ─────────────────────────────────────────────────────────────────────────────
// Categories
// ─────────────────────────────────────────────────────────────────────────────

export class CreateCategoryDto {
  @ApiProperty() @IsString() @MinLength(2) name!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() slug?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() icon?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() bannerImage?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() thumbnailUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() color?: string;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() sortOrder?: number;
  @ApiPropertyOptional({ enum: CategoryStatus })
  @IsOptional()
  @IsEnum(CategoryStatus)
  status?: CategoryStatus;
  @ApiPropertyOptional({ enum: CategoryVisibility })
  @IsOptional()
  @IsEnum(CategoryVisibility)
  visibility?: CategoryVisibility;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isFeatured?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsString() seoTitle?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() seoDescription?: string;
  @ApiPropertyOptional() @IsOptional() @IsArray() @IsString({ each: true }) seoKeywords?: string[];
}

export class UpdateCategoryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @MinLength(2) name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() slug?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() icon?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() bannerImage?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() thumbnailUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() color?: string;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() sortOrder?: number;
  @ApiPropertyOptional({ enum: CategoryStatus })
  @IsOptional()
  @IsEnum(CategoryStatus)
  status?: CategoryStatus;
  @ApiPropertyOptional({ enum: CategoryVisibility })
  @IsOptional()
  @IsEnum(CategoryVisibility)
  visibility?: CategoryVisibility;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isFeatured?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsString() seoTitle?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() seoDescription?: string;
  @ApiPropertyOptional() @IsOptional() @IsArray() @IsString({ each: true }) seoKeywords?: string[];
}

export class CreateSubCategoryDto {
  @ApiProperty() @IsString() categoryId!: string;
  @ApiProperty() @IsString() @MinLength(2) name!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() slug?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() icon?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() color?: string;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() sortOrder?: number;
  @ApiPropertyOptional({ enum: CategoryStatus })
  @IsOptional()
  @IsEnum(CategoryStatus)
  status?: CategoryStatus;
  @ApiPropertyOptional({ enum: CategoryVisibility })
  @IsOptional()
  @IsEnum(CategoryVisibility)
  visibility?: CategoryVisibility;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isFeatured?: boolean;
}

export class UpdateSubCategoryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() categoryId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MinLength(2) name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() slug?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() icon?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() color?: string;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() sortOrder?: number;
  @ApiPropertyOptional({ enum: CategoryStatus })
  @IsOptional()
  @IsEnum(CategoryStatus)
  status?: CategoryStatus;
  @ApiPropertyOptional({ enum: CategoryVisibility })
  @IsOptional()
  @IsEnum(CategoryVisibility)
  visibility?: CategoryVisibility;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isFeatured?: boolean;
}

export class CreateSubjectDto {
  @ApiProperty() @IsString() categoryId!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() subCategoryId?: string;
  @ApiProperty() @IsString() @MinLength(2) name!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() code?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() slug?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() icon?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() color?: string;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() sortOrder?: number;
  @ApiPropertyOptional({ enum: SubjectStatus })
  @IsOptional()
  @IsEnum(SubjectStatus)
  status?: SubjectStatus;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isFeatured?: boolean;
}

export class UpdateSubjectDto {
  @ApiPropertyOptional() @IsOptional() @IsString() categoryId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() subCategoryId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MinLength(2) name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() code?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() slug?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() icon?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() color?: string;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() sortOrder?: number;
  @ApiPropertyOptional({ enum: SubjectStatus })
  @IsOptional()
  @IsEnum(SubjectStatus)
  status?: SubjectStatus;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isFeatured?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Courses
// ─────────────────────────────────────────────────────────────────────────────

export class CreateCourseDto {
  @ApiPropertyOptional() @IsOptional() @IsString() categoryId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() subCategoryId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() subjectId?: string;
  @ApiProperty() @IsString() @MinLength(3) title!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() slug?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() subtitle?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() shortDescription?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() thumbnailUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() coverImage?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() introVideoUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() previewVideoUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsArray() galleryImages?: unknown[];
  @ApiPropertyOptional() @IsOptional() @IsString() language?: string;
  @ApiPropertyOptional({ enum: CourseLevel })
  @IsOptional()
  @IsEnum(CourseLevel)
  level?: CourseLevel;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() durationMinutes?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() price?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() discountPrice?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() currency?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isFree?: boolean;
  @ApiPropertyOptional({ enum: CourseStatus })
  @IsOptional()
  @IsEnum(CourseStatus)
  status?: CourseStatus;
  @ApiPropertyOptional({ enum: CourseVisibility })
  @IsOptional()
  @IsEnum(CourseVisibility)
  visibility?: CourseVisibility;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isPublished?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isFeatured?: boolean;
  @ApiPropertyOptional() @IsOptional() requirements?: unknown;
  @ApiPropertyOptional() @IsOptional() learningOutcomes?: unknown;
  @ApiPropertyOptional() @IsOptional() @IsArray() @IsString({ each: true }) tags?: string[];
  @ApiPropertyOptional() @IsOptional() @IsBoolean() certificateEnabled?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() discussionEnabled?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() commentsEnabled?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() downloadResources?: boolean;
}

export class UpdateCourseDto {
  @ApiPropertyOptional() @IsOptional() @IsString() categoryId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() subCategoryId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() subjectId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MinLength(3) title?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() subtitle?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() shortDescription?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() thumbnailUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() coverImage?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() introVideoUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() previewVideoUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsArray() galleryImages?: unknown[];
  @ApiPropertyOptional() @IsOptional() @IsString() language?: string;
  @ApiPropertyOptional({ enum: CourseLevel })
  @IsOptional()
  @IsEnum(CourseLevel)
  level?: CourseLevel;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() durationMinutes?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() price?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() discountPrice?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() currency?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isFree?: boolean;
  @ApiPropertyOptional({ enum: CourseStatus })
  @IsOptional()
  @IsEnum(CourseStatus)
  status?: CourseStatus;
  @ApiPropertyOptional({ enum: CourseVisibility })
  @IsOptional()
  @IsEnum(CourseVisibility)
  visibility?: CourseVisibility;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isPublished?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isFeatured?: boolean;
  @ApiPropertyOptional() @IsOptional() requirements?: unknown;
  @ApiPropertyOptional() @IsOptional() learningOutcomes?: unknown;
  @ApiPropertyOptional() @IsOptional() @IsArray() @IsString({ each: true }) tags?: string[];
  @ApiPropertyOptional() @IsOptional() @IsBoolean() certificateEnabled?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() discussionEnabled?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() commentsEnabled?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() downloadResources?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsString() rejectionReason?: string;
}

export class PublishCourseDto {
  @ApiProperty({ enum: CourseStatus }) @IsEnum(CourseStatus) status!: CourseStatus;
  @ApiPropertyOptional() @IsOptional() @IsString() note?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Chapters
// ─────────────────────────────────────────────────────────────────────────────

export class CreateChapterDto {
  @ApiProperty() @IsString() @MinLength(2) title!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() summary?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() icon?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() coverImage?: string;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() chapterNumber?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() sortOrder?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() estimatedDuration?: number;
  @ApiPropertyOptional({ enum: ChapterStatus })
  @IsOptional()
  @IsEnum(ChapterStatus)
  status?: ChapterStatus;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isPreview?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isLocked?: boolean;
}

export class UpdateChapterDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @MinLength(2) title?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() summary?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() icon?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() coverImage?: string;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() chapterNumber?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() sortOrder?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() estimatedDuration?: number;
  @ApiPropertyOptional({ enum: ChapterStatus })
  @IsOptional()
  @IsEnum(ChapterStatus)
  status?: ChapterStatus;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isPreview?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isLocked?: boolean;
}

export class ReorderChaptersDto {
  @ApiProperty({ type: [String] }) @IsArray() chapterIds!: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Lessons
// ─────────────────────────────────────────────────────────────────────────────

export class CreateLessonDto {
  @ApiProperty() @IsString() @MinLength(2) title!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() content?: unknown;
  @ApiPropertyOptional({ enum: LessonType }) @IsOptional() @IsEnum(LessonType) type?: LessonType;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() lessonNumber?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() orderIndex?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() durationMinutes?: number;
  @ApiPropertyOptional({ enum: LessonStatus })
  @IsOptional()
  @IsEnum(LessonStatus)
  status?: LessonStatus;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isFree?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isPreview?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isLocked?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isPublished?: boolean;
}

export class UpdateLessonDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @MinLength(2) title?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() content?: unknown;
  @ApiPropertyOptional({ enum: LessonType }) @IsOptional() @IsEnum(LessonType) type?: LessonType;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() lessonNumber?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() orderIndex?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() durationMinutes?: number;
  @ApiPropertyOptional({ enum: LessonStatus })
  @IsOptional()
  @IsEnum(LessonStatus)
  status?: LessonStatus;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isFree?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isPreview?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isLocked?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isPublished?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Lesson content: videos, PDFs, attachments, resources
// ─────────────────────────────────────────────────────────────────────────────

export class CreateLessonVideoDto {
  @ApiPropertyOptional() @IsOptional() @IsString() title?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiProperty() @IsString() url!: string;
  @ApiPropertyOptional({ enum: VideoSource })
  @IsOptional()
  @IsEnum(VideoSource)
  source?: VideoSource;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() durationSeconds?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() thumbnailUrl?: string;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() sizeBytes?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() resolution?: string;
  @ApiPropertyOptional({ enum: VideoQuality })
  @IsOptional()
  @IsEnum(VideoQuality)
  quality?: VideoQuality;
  @ApiPropertyOptional() @IsOptional() captions?: unknown;
  @ApiPropertyOptional() @IsOptional() @IsString() watermarkUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isPreview?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() hasWatermark?: boolean;
}

export class UpdateLessonVideoDto {
  @ApiPropertyOptional() @IsOptional() @IsString() title?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() url?: string;
  @ApiPropertyOptional({ enum: VideoSource })
  @IsOptional()
  @IsEnum(VideoSource)
  source?: VideoSource;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() durationSeconds?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() thumbnailUrl?: string;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() sizeBytes?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() resolution?: string;
  @ApiPropertyOptional({ enum: VideoQuality })
  @IsOptional()
  @IsEnum(VideoQuality)
  quality?: VideoQuality;
  @ApiPropertyOptional() @IsOptional() captions?: unknown;
  @ApiPropertyOptional() @IsOptional() @IsString() watermarkUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isPreview?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() hasWatermark?: boolean;
}

export class CreateLessonPdfDto {
  @ApiPropertyOptional() @IsOptional() @IsString() title?: string;
  @ApiProperty() @IsString() url!: string;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() pageCount?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() sizeBytes?: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isPreview?: boolean;
}

export class UpdateLessonPdfDto {
  @ApiPropertyOptional() @IsOptional() @IsString() title?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() url?: string;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() pageCount?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() sizeBytes?: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isPreview?: boolean;
}

export class CreateLessonAttachmentDto {
  @ApiPropertyOptional() @IsOptional() @IsString() title?: string;
  @ApiProperty() @IsString() fileName!: string;
  @ApiProperty() @IsString() fileUrl!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() mimeType?: string;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() sizeBytes?: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isPreview?: boolean;
}

export class CreateLessonResourceDto {
  @ApiProperty() @IsString() title!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() type?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() url?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() content?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isExternal?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Reviews / Ratings
// ─────────────────────────────────────────────────────────────────────────────

export class CreateCourseReviewDto {
  @ApiProperty() @Type(() => Number) @IsInt() @Min(1) @Max(5) rating!: number;
  @ApiPropertyOptional() @IsOptional() @IsString() title?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() comment?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isAnonymous?: boolean;
}

export class UpdateCourseReviewDto {
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(5) rating?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() title?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() comment?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isAnonymous?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Course resources
// ─────────────────────────────────────────────────────────────────────────────

export class CreateCourseResourceDto {
  @ApiProperty() @IsString() title!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() type?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() category?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() url?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() fileUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() fileName?: string;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() fileSize?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() mimeType?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() content?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isExternal?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isPublished?: boolean;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() sortOrder?: number;
}

export class UpdateCourseResourceDto {
  @ApiPropertyOptional() @IsOptional() @IsString() title?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() type?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() category?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() url?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() fileUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() fileName?: string;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() fileSize?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() mimeType?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() content?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isExternal?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isPublished?: boolean;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() sortOrder?: number;
}
