import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsArray,
  MinLength,
  MaxLength,
  Min,
  Max,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

// ─────────────────────────────────────────────────────────────────────────────
// Profile
// ─────────────────────────────────────────────────────────────────────────────

export class UpdateProfileDto {
  @ApiPropertyOptional() @IsOptional() @IsString() firstName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() lastName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() displayName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() avatarUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() phone?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() bio?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() timezone?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() locale?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() gender?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() dateOfBirth?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() city?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() state?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() country?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() postalCode?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() grade?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() school?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() major?: string;
}

export class ChangePasswordDto {
  @ApiProperty() @IsString() @MinLength(8) currentPassword!: string;
  @ApiProperty() @IsString() @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/, { message: 'Password must contain at least 8 characters, an uppercase letter, a lowercase letter, a number, and a special character.' }) newPassword!: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Booking
// ─────────────────────────────────────────────────────────────────────────────

export class CreateBookingDto {
  @ApiProperty() @IsString() teacherId!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() availabilityId?: string;
  @ApiProperty() @IsString() startTime!: string;
  @ApiProperty() @IsString() endTime!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() timezone?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isOnline?: boolean;
}

export class CancelBookingDto {
  @ApiPropertyOptional() @IsOptional() @IsString() reason?: string;
}

export class RescheduleBookingDto {
  @ApiProperty() @IsString() startTime!: string;
  @ApiProperty() @IsString() endTime!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() reason?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Homework
// ─────────────────────────────────────────────────────────────────────────────

export class SubmitAssignmentDto {
  @ApiPropertyOptional() @IsOptional() @IsString() content?: string;
  @ApiPropertyOptional() @IsOptional() submissionFiles?: any;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() replace?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Exams
// ─────────────────────────────────────────────────────────────────────────────

export class ExamAnswerDto {
  @ApiProperty() @IsString() questionId!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() choiceId?: string;
  @ApiPropertyOptional() @IsOptional() answer?: any;
}

export class SubmitExamDto {
  @ApiProperty({ type: [ExamAnswerDto] })
  @IsArray()
  @Type(() => ExamAnswerDto)
  answers!: ExamAnswerDto[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Messages
// ─────────────────────────────────────────────────────────────────────────────

export class SendMessageDto {
  @ApiProperty() @IsString() @MaxLength(5000) content!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() type?: string;
  @ApiPropertyOptional() @IsOptional() metadata?: any;
}

// ─────────────────────────────────────────────────────────────────────────────
// Feedback
// ─────────────────────────────────────────────────────────────────────────────

export class RatingDto {
  @ApiProperty() @IsNumber() @Min(1) @Max(5) rating!: number;
  @ApiPropertyOptional() @IsOptional() @IsString() comment?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isAnonymous?: boolean;
}

export class ReportIssueDto {
  @ApiProperty() @IsString() title!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() category?: string;
  @ApiPropertyOptional() @IsOptional() attachments?: any;
}

// ─────────────────────────────────────────────────────────────────────────────
// Settings
// ─────────────────────────────────────────────────────────────────────────────

export class UpdateNotificationSettingsDto {
  @ApiProperty() settings!: Record<string, unknown>;
}

export class UpdateThemePreferenceDto {
  @ApiPropertyOptional() @IsOptional() @IsString() theme?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() primaryColor?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// File upload metadata
// ─────────────────────────────────────────────────────────────────────────────

export class FileUploadDto {
  @ApiPropertyOptional() @IsOptional() @IsString() folder?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isPublic?: boolean;
  @ApiPropertyOptional() @IsOptional() metadata?: Record<string, unknown>;
}
