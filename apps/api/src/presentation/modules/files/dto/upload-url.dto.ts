import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class UploadUrlDto {
  @ApiProperty({ example: 'lesson-notes.pdf' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  fileName!: string;

  @ApiProperty({ example: 'application/pdf' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(127)
  contentType!: string;

  @ApiPropertyOptional({ enum: ['IMAGE', 'VIDEO', 'FILE'] })
  @IsOptional()
  @IsIn(['IMAGE', 'VIDEO', 'FILE'])
  resourceType?: 'IMAGE' | 'VIDEO' | 'FILE';
}
