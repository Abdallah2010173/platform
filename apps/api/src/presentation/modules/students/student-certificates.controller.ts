import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { Public } from '../../decorators/public.decorator';
import { IsString } from 'class-validator';
import { AuthenticatedUser } from './student.helper';
import { StudentCertificateService } from './services';

export class VerifyCertificateDto {
  @IsString()
  certificateNumber!: string;
}

@ApiTags('Student Certificates')
@ApiBearerAuth()
@Controller('student/certificates')
export class StudentCertificatesController {
  constructor(private readonly certificateService: StudentCertificateService) {}

  @Get()
  @ApiOperation({ summary: 'Get my certificates' })
  getCertificates(@CurrentUser() user: AuthenticatedUser) {
    return this.certificateService.getCertificates(user);
  }

  @Get(':certificateId')
  @ApiOperation({ summary: 'Get certificate detail' })
  getCertificateDetail(
    @CurrentUser() user: AuthenticatedUser,
    @Param('certificateId') certificateId: string,
  ): Promise<Record<string, any>> {
    return this.certificateService.getCertificateDetail(user, certificateId);
  }

  @Post(':certificateId/download')
  @ApiOperation({ summary: 'Record a certificate download' })
  recordDownload(
    @CurrentUser() user: AuthenticatedUser,
    @Param('certificateId') certificateId: string,
  ) {
    return this.certificateService.recordDownload(user, certificateId);
  }

  @Public()
  @Post('verify')
  @ApiOperation({ summary: 'Verify a certificate by number' })
  verify(@Body() dto: VerifyCertificateDto) {
    return this.certificateService.verifyCertificate(dto.certificateNumber);
  }
}
