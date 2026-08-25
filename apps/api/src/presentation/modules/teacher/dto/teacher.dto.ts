import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsArray,
  IsDateString,
  IsIn,
  IsUrl,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

const ASSIGNMENT_TYPES = ['HOMEWORK', 'PROJECT', 'QUIZ', 'WORKSHEET'] as const;
const EXAM_TYPES = ['MCQ', 'ESSAY', 'MIXED', 'PRACTICAL'] as const;
const EXAM_RESOURCE_TYPES = ['PDF', 'GOOGLE_FORM', 'INTERNAL'] as const;
const MEETING_STATUSES = ['SCHEDULED', 'LIVE', 'ENDED', 'CANCELED', 'RECORDING'] as const;
const RECURRENCE_TYPES = ['NONE', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'] as const;
const QUESTION_TYPES = [
  'MULTIPLE_CHOICE',
  'TRUE_FALSE',
  'SHORT_ANSWER',
  'ESSAY',
  'MATCHING',
  'FILL_BLANK',
] as const;
const DIFFICULTY_LEVELS = ['EASY', 'MEDIUM', 'HARD', 'EXPERT'] as const;

export class UpdateTeacherProfileDto {
  @ApiPropertyOptional() @IsOptional() @IsString() firstName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() lastName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() displayName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() avatarUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() phone?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() bio?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() timezone?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() locale?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() gender?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() city?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() state?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() country?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() title?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() department?: string;
  @ApiPropertyOptional() @IsOptional() @IsArray() @IsString({ each: true }) expertise?: string[];
  @ApiPropertyOptional() @IsOptional() @IsNumber() hourlyRate?: number;
}

export class ChangeTeacherPasswordDto {
  @ApiProperty() @IsString() currentPassword!: string;
  @ApiProperty({ minLength: 8 }) @IsString() @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/, { message: 'Password must contain at least 8 characters, an uppercase letter, a lowercase letter, a number, and a special character.' }) newPassword!: string;
}

export class CreateAssignmentDto {
  @ApiProperty() @IsString() title!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsIn(ASSIGNMENT_TYPES) type?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() dueDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() totalMarks?: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isPublished?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsString() instructions?: string;
  @ApiPropertyOptional() @IsOptional() attachmentsJson?: unknown;
}

export class UpdateAssignmentDto extends PartialType(CreateAssignmentDto) {}

export class GradeSubmissionDto {
  @ApiPropertyOptional() @IsOptional() @IsNumber() marksObtained?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() totalMarks?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() letterGrade?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() feedback?: string;
}

export class CreateExamDto {
  @ApiProperty() @IsString() title!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsIn(EXAM_TYPES) type?: string;
  @ApiProperty() @IsNumber() durationMinutes!: number;
  @ApiProperty() @IsNumber() totalMarks!: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() passMarks?: number;
  @ApiPropertyOptional() @IsOptional() @IsDateString() startTime?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() endTime?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isPublished?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsString() instructions?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() shuffleQuestions?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsNumber() maxAttempts?: number;
  @ApiPropertyOptional() @IsOptional() @IsIn(EXAM_RESOURCE_TYPES) resourceType?: string;
  @ApiPropertyOptional() @IsOptional() @IsUrl({ protocols: ['https'], require_protocol: true }) resourceUrl?: string;
}

export class UpdateExamDto extends PartialType(CreateExamDto) {}

export class CreateQuestionBankDto {
  @ApiPropertyOptional() @IsOptional() @IsString() courseId?: string;
  @ApiProperty() @IsString() title!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() subject?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isPublic?: boolean;
}

class QuestionChoiceDto {
  @ApiProperty() @IsString() text!: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isCorrect?: boolean;
}

class QuestionInputDto {
  @ApiProperty() @IsString() text!: string;
  @ApiPropertyOptional() @IsOptional() @IsIn(QUESTION_TYPES) type?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() marks?: number;
  @ApiPropertyOptional() @IsOptional() @IsIn(DIFFICULTY_LEVELS) difficulty?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() explanation?: string;
  @ApiPropertyOptional() @IsOptional() options?: unknown;
  @ApiPropertyOptional() @IsOptional() correctAnswer?: unknown;
  @ApiPropertyOptional() @IsOptional() @IsArray() choices?: QuestionChoiceDto[];
}

export class AddQuestionsDto {
  @ApiProperty({ type: [QuestionInputDto] }) @IsArray() questions!: QuestionInputDto[];
}

export class CreateMeetingDto {
  @ApiPropertyOptional() @IsOptional() @IsString() courseId?: string;
  @ApiProperty() @IsString() topic!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() agenda?: string;
  @ApiProperty() @IsDateString() startTime!: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() durationMinutes?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() timezone?: string;
  @ApiPropertyOptional() @IsOptional() @IsUrl({ protocols: ['http', 'https'], require_protocol: true }) joinUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsUrl({ protocols: ['http', 'https'], require_protocol: true }) startUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() password?: string;
  @ApiPropertyOptional() @IsOptional() @IsIn(MEETING_STATUSES) status?: string;
  @ApiPropertyOptional() @IsOptional() settings?: unknown;
}

export class UpdateMeetingDto extends PartialType(CreateMeetingDto) {}

export class SetAvailabilityDto {
  @ApiProperty() @IsNumber() dayOfWeek!: number;
  @ApiProperty() @IsString() startTime!: string;
  @ApiProperty() @IsString() endTime!: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isAvailable?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsIn(RECURRENCE_TYPES) recurrence?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() validFrom?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() validTo?: string;
}

export class UpdateAvailabilityDto extends PartialType(SetAvailabilityDto) {}

