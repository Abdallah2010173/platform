import { Controller, Get, Post, Put, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../../decorators/roles.decorator';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto, ChangeUserPasswordDto } from './dto/users.dto';
import { PaginationDto, BulkActionDto } from '../../common/dto/pagination.dto';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'List all users with pagination, search, filter, sort' })
  findAll(@Query() query: PaginationDto & { role?: Role }) {
    return this.usersService.findAll(query);
  }

  @Get('stats')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Get user statistics' })
  getStats() {
    return this.usersService.getStats();
  }

  @Get(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Get a user by id' })
  findById(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Create a new user' })
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Update a user' })
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Soft delete a user' })
  softDelete(@Param('id') id: string) {
    return this.usersService.softDelete(id);
  }

  @Delete(':id/hard')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Hard delete a user' })
  hardDelete(@Param('id') id: string) {
    return this.usersService.hardDelete(id);
  }

  @Post(':id/restore')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Restore a soft-deleted user' })
  restore(@Param('id') id: string) {
    return this.usersService.restore(id);
  }

  @Post(':id/change-password')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Change a user password' })
  changePassword(@Param('id') id: string, @Body() dto: ChangeUserPasswordDto) {
    return this.usersService.changePassword(id, dto.newPassword);
  }

  @Post('bulk')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({
    summary: 'Bulk actions: DELETE, HARD_DELETE, RESTORE, ACTIVATE, DEACTIVATE, CHANGE_ROLE',
  })
  bulk(@Body() dto: BulkActionDto) {
    return this.usersService.bulkAction(dto.ids, dto.action, (dto as any).extra);
  }

  @Put(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Replace a user (alias for update)' })
  replace(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }
}
