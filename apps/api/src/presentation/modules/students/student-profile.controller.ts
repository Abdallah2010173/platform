import { Controller, Get, Patch, Post, Delete, Body, Param } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { AuthenticatedUser } from './student.helper';
import { StudentProfileService } from './services';
import { UpdateProfileDto, ChangePasswordDto } from './dto/student.dto';

@ApiTags('Student Profile')
@ApiBearerAuth()
@Controller('student/profile')
export class StudentProfileController {
  constructor(private readonly profileService: StudentProfileService) {}

  @Get()
  @ApiOperation({ summary: 'Get student profile' })
  getProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.profileService.getProfile(user);
  }

  @Patch()
  @ApiOperation({ summary: 'Update student profile' })
  updateProfile(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateProfileDto) {
    return this.profileService.updateProfile(user, dto);
  }

  @Post('change-password')
  @ApiOperation({ summary: 'Change student password' })
  changePassword(@CurrentUser() user: AuthenticatedUser, @Body() dto: ChangePasswordDto) {
    return this.profileService.changePassword(user, dto);
  }

  @Get('devices')
  @ApiOperation({ summary: 'List student devices' })
  getDevices(@CurrentUser() user: AuthenticatedUser): Promise<Record<string, any>[]> {
    return this.profileService.getDevices(user);
  }

  @Delete('devices/:deviceId')
  @ApiOperation({ summary: 'Revoke a device' })
  revokeDevice(@CurrentUser() user: AuthenticatedUser, @Param('deviceId') deviceId: string) {
    return this.profileService.revokeDevice(user, deviceId);
  }
}
