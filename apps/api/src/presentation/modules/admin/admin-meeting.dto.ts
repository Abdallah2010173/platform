import { IsDateString, IsIn, IsNumber, IsOptional, IsString, IsUrl, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

const STATUSES = ['SCHEDULED', 'LIVE', 'ENDED', 'CANCELED', 'RECORDING'] as const;

export class CreateAdminMeetingDto {
  @ApiProperty() @IsUUID() teacherId!: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() courseId?: string;
  @ApiProperty() @IsString() topic!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiProperty() @IsDateString() startTime!: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() durationMinutes?: number;
  @ApiPropertyOptional() @IsOptional() @IsUrl({ protocols: ['http', 'https'], require_protocol: true }) joinUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsIn(STATUSES) status?: string;
}

export class UpdateAdminMeetingDto extends PartialType(CreateAdminMeetingDto) {}
