import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';
import { Public } from '@app/auth';

@ApiTags('health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Get('ping')
  @ApiOperation({ summary: 'Liveness probe' })
  @ApiOkResponse({
    schema: {
      example: {
        status: 'ok',
        message: 'pong',
        timestamp: '2026-05-19T12:00:00.000Z',
      },
    },
  })
  ping() {
    return this.appService.ping();
  }
}
