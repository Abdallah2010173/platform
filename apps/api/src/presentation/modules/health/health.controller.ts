import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../../decorators/public.decorator';
import { PrismaService } from '../../../infrastructure/database/prisma.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Health check endpoint' })
  async check() {
    let database = 'disconnected';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      database = 'connected';
    } catch {
      database = 'error';
    }

    return {
      status: database === 'connected' ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      services: { database },
    };
  }
}
