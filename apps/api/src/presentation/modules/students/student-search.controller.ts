import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { AuthenticatedUser } from './student.helper';
import { StudentSearchService } from './services';

@ApiTags('Student Search')
@ApiBearerAuth()
@Controller('student/search')
export class StudentSearchController {
  constructor(private readonly searchService: StudentSearchService) {}

  @Get()
  @ApiOperation({ summary: 'Search courses, lessons, and resources' })
  search(
    @CurrentUser() user: AuthenticatedUser,
    @Query('q') q: string,
    @Query('type') type?: string,
  ): Promise<Record<string, any>> {
    return this.searchService.searchAll(user, q, type ? type.split(',') : undefined);
  }

  @Get('courses')
  @ApiOperation({ summary: 'Search courses with pagination' })
  searchCourses(
    @CurrentUser() user: AuthenticatedUser,
    @Query('q') q: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<Record<string, any>> {
    return this.searchService.searchCourses(
      user,
      q,
      page ? Number(page) : 1,
      limit ? Number(limit) : 12,
    );
  }
}
