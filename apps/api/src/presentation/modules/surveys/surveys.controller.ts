import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { Roles } from '../../decorators/roles.decorator';
import { CreateSurveyDto, UpdateSurveyDto } from './survey.dto';
import { SurveysService } from './surveys.service';

@ApiTags('Surveys') @ApiBearerAuth() @Controller('surveys')
export class SurveysController {
  constructor(private readonly surveys: SurveysService) {}
  @Get('mine') @Roles(Role.TEACHER, Role.ADMIN) mine(@CurrentUser() user: any, @Query('courseId') courseId?: string) { return this.surveys.listForTeacher(user, courseId); }
  @Get('available') @Roles(Role.STUDENT) available(@CurrentUser() user: any) { return this.surveys.listForStudent(user); }
  @Post('courses/:courseId') @Roles(Role.TEACHER, Role.ADMIN) create(@CurrentUser() user: any, @Param('courseId') courseId: string, @Body() dto: CreateSurveyDto) { return this.surveys.create(user, courseId, dto); }
  @Patch(':id') @Roles(Role.TEACHER, Role.ADMIN) update(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: UpdateSurveyDto) { return this.surveys.update(user, id, dto); }
  @Delete(':id') @Roles(Role.TEACHER, Role.ADMIN) remove(@CurrentUser() user: any, @Param('id') id: string) { return this.surveys.remove(user, id); }
}
