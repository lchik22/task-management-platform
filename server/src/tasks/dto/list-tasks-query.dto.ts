import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { TaskPriority } from '../types/task-priority.enum';
import { TaskStatus } from '../types/task-status.enum';

export class ListTasksQueryDto {
  @ApiPropertyOptional({ enum: TaskStatus })
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @ApiPropertyOptional({ enum: TaskPriority })
  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @ApiPropertyOptional({
    description:
      'User id (24-char ObjectId), "me" for the current user, or "unassigned" for tasks without an assignee',
    example: 'me',
  })
  @IsOptional()
  @IsString()
  assignee?: string;
}
