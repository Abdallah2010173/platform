import { PartialType } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

export class CreateSurveyDto {
  @IsString() @MaxLength(200) title!: string;
  @IsOptional() @IsString() @MaxLength(4000) description?: string;
  @IsUrl({ protocols: ['https'], require_protocol: true }) externalUrl!: string;
  @IsOptional() @IsBoolean() isPublished?: boolean;
  @IsOptional() @IsDateString() startsAt?: string;
  @IsOptional() @IsDateString() endsAt?: string;
}

export class UpdateSurveyDto extends PartialType(CreateSurveyDto) {}
