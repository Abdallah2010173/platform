import { Controller, Get, Patch, Body } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { AuthenticatedUser } from './student.helper';
import { StudentSettingsService } from './services';
import {
  UpdateNotificationSettingsDto,
  UpdateThemePreferenceDto,
  ChangePasswordDto,
} from './dto/student.dto';

@ApiTags('Student Settings')
@ApiBearerAuth()
@Controller('student/settings')
export class StudentSettingsController {
  constructor(private readonly settingsService: StudentSettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all settings' })
  getSettings(@CurrentUser() user: AuthenticatedUser): Promise<Record<string, any>> {
    return this.settingsService.getSettings(user);
  }

  @Get('notification-preferences')
  @ApiOperation({ summary: 'Get notification preferences' })
  getNotificationSettings(@CurrentUser() user: AuthenticatedUser): Promise<Record<string, any>> {
    return this.settingsService.getNotificationSettings(user);
  }

  @Patch('notification-preferences')
  @ApiOperation({ summary: 'Update notification preferences' })
  updateNotificationSettings(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateNotificationSettingsDto,
  ): Promise<Record<string, any>> {
    return this.settingsService.updateNotificationSettings(user, dto.settings);
  }

  @Patch('theme')
  @ApiOperation({ summary: 'Update theme preference' })
  updateThemePreference(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateThemePreferenceDto,
  ): Promise<Record<string, any>> {
    return this.settingsService.updateThemePreference(user, dto);
  }

  @Patch('password')
  @ApiOperation({ summary: 'Change password' })
  updatePassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ChangePasswordDto,
  ): Promise<Record<string, any>> {
    return this.settingsService.updatePassword(user, dto);
  }

  @Get('profile')
  @ApiOperation({ summary: 'Get profile settings' })
  getProfileSettings(@CurrentUser() user: AuthenticatedUser): Promise<Record<string, any>> {
    return this.settingsService.getProfileSettings(user);
  }
}
