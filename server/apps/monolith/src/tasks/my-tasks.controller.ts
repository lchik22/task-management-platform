import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Types } from 'mongoose';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/types/jwt-payload.type';
import { ListMyTasksQueryDto } from './dto/list-my-tasks-query.dto';
import { TasksService } from './tasks.service';

@ApiTags('my-tasks')
@ApiBearerAuth()
@Controller('tasks/mine')
export class MyTasksController {
  constructor(private readonly tasks: TasksService) {}

  @Get()
  @ApiOperation({
    summary: 'List tasks assigned to the current user across all projects',
  })
  @ApiResponse({ status: 200, description: 'List of assigned tasks' })
  list(@Query() query: ListMyTasksQueryDto, @CurrentUser() user: JwtPayload) {
    return this.tasks.listMine(new Types.ObjectId(user.sub), query);
  }
}
