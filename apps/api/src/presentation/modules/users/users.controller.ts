import { Controller, Get, Post, Put, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../../decorators/roles.decorator';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto, ChangeUserPasswordDto } from './dto/users.dto';
import { PaginationDto, BulkActionDto } from '../../common/dto/pagination.dto';
import { ParsePaginationPipe } from '../../common/pipes/parse-pagination.pipe';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

@Get()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'List all users with pagination, search, filter, sort' })
  findAll(@Query(new ParsePaginationPipe()) query: PaginationDto & { role?: Role }) {
    return this.usersService.findAll(query);
  }

  @Get('stats')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get user statistics' })
  getStats() {
    return this.usersService.getStats();
  }

  @Get(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get a user by id' })
  findById(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create a new user' })
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update a user' })
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Soft delete a user' })
  softDelete(@Param('id') id: string) {
    return this.usersService.softDelete(id);
  }

  @Post(':id/restore')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Restore a soft-deleted user' })
  restore(@Param('id') id: string) {
    return this.usersService.restore(id);
  }

  @Post(':id/change-password')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Change a user password' })
  changePassword(@Param('id') id: string, @Body() dto: ChangeUserPasswordDto) {
    return this.usersService.changePassword(id, dto.newPassword);
  }

  @Post('bulk')
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Bulk actions: DELETE, RESTORE, ACTIVATE, DEACTIVATE, CHANGE_ROLE',
  })
  bulk(@Body() dto: BulkActionDto) {
    return this.usersService.bulkAction(dto.ids, dto.action, dto.extra);
  }

  @Put(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Replace a user (alias for update)' })
  replace(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }
}
