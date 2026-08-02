import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { AuthenticatedUser } from './student.helper';
import { StudentStatsService } from './services';

@ApiTags('Student')
@ApiBearerAuth()
@Controller('student')
export class StudentsController {
  constructor(private readonly statsService: StudentStatsService) {}

  @Get('stats/home')
  @ApiOperation({ summary: 'Get student home dashboard stats' })
  getHomeStats(@CurrentUser() user: AuthenticatedUser): Promise<Record<string, any>> {
    return this.statsService.getHomeStats(user);
  }

  @Get('stats/progress')
  @ApiOperation({ summary: 'Get student progress overview' })
  getProgress(@CurrentUser() user: AuthenticatedUser): Promise<Record<string, any>> {
    return this.statsService.getProgress(user);
  }
}
