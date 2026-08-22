import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@platform/database';
import { Roles } from '../../decorators/roles.decorator';
import { AdminMeetingService } from './admin-meeting.service';
import { CreateAdminMeetingDto, UpdateAdminMeetingDto } from './admin-meeting.dto';

@ApiTags('Admin Meetings')
@ApiBearerAuth()
@Roles(Role.ADMIN)
@Controller('admin/meetings')
export class AdminMeetingController {
  constructor(private readonly service: AdminMeetingService) {}
  @Get() getAll() { return this.service.getAll(); }
  @Post() create(@Body() dto: CreateAdminMeetingDto) { return this.service.create(dto); }
  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateAdminMeetingDto) { return this.service.update(id, dto); }
  @Delete(':id') remove(@Param('id') id: string) { return this.service.remove(id); }
}
