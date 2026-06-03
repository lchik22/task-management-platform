import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Types } from 'mongoose';
import { CurrentUser, type JwtPayload } from '@app/auth';
import { CreateTaskDto } from './dto/create-task.dto';
import { ListTasksQueryDto } from './dto/list-tasks-query.dto';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TasksService } from './tasks.service';

@ApiTags('tasks')
@ApiBearerAuth()
@Controller('projects/:projectId/tasks')
export class TasksController {
  constructor(private readonly tasks: TasksService) {}

  @Post()
  @HttpCode(201)
  @ApiOperation({ summary: 'Create a task in a project (any member)' })
  @ApiResponse({ status: 201, description: 'Task created' })
  @ApiResponse({
    status: 400,
    description: 'Validation error or assignee is not a project member',
  })
  @ApiResponse({ status: 403, description: 'Caller is not a project member' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  create(
    @Param('projectId') projectId: string,
    @Body() dto: CreateTaskDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.tasks.create(projectId, dto, new Types.ObjectId(user.sub));
  }

  @Get()
  @ApiOperation({
    summary: 'List tasks in a project (any member). Supports filters.',
  })
  @ApiResponse({ status: 200, description: 'List of tasks' })
  @ApiResponse({ status: 403, description: 'Caller is not a project member' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  list(
    @Param('projectId') projectId: string,
    @Query() query: ListTasksQueryDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.tasks.listForProject(
      projectId,
      query,
      new Types.ObjectId(user.sub),
    );
  }

  @Get(':taskId')
  @ApiOperation({ summary: 'Get a single task (any project member)' })
  @ApiResponse({ status: 200, description: 'Task details' })
  @ApiResponse({ status: 403, description: 'Caller is not a project member' })
  @ApiResponse({ status: 404, description: 'Project or task not found' })
  findOne(
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.tasks.findOne(projectId, taskId, new Types.ObjectId(user.sub));
  }

  @Patch(':taskId')
  @ApiOperation({ summary: 'Update a task (creator or project owner)' })
  @ApiResponse({ status: 200, description: 'Task updated' })
  @ApiResponse({
    status: 400,
    description: 'Validation error or assignee is not a project member',
  })
  @ApiResponse({
    status: 403,
    description: 'Caller is not the creator or project owner',
  })
  @ApiResponse({ status: 404, description: 'Project or task not found' })
  update(
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
    @Body() dto: UpdateTaskDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.tasks.update(
      projectId,
      taskId,
      dto,
      new Types.ObjectId(user.sub),
    );
  }

  @Patch(':taskId/status')
  @ApiOperation({
    summary: 'Update a task status (creator, assignee, or project owner)',
  })
  @ApiResponse({ status: 200, description: 'Task status updated' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({
    status: 403,
    description: 'Caller cannot change status of this task',
  })
  @ApiResponse({ status: 404, description: 'Project or task not found' })
  updateStatus(
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
    @Body() dto: UpdateTaskStatusDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.tasks.updateStatus(
      projectId,
      taskId,
      dto,
      new Types.ObjectId(user.sub),
    );
  }

  @Delete(':taskId')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete a task (creator or project owner)' })
  @ApiResponse({ status: 204, description: 'Task deleted' })
  @ApiResponse({
    status: 403,
    description: 'Caller is not the creator or project owner',
  })
  @ApiResponse({ status: 404, description: 'Project or task not found' })
  async remove(
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.tasks.remove(projectId, taskId, new Types.ObjectId(user.sub));
  }
}
