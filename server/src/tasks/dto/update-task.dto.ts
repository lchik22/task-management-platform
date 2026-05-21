import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsMongoId,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { TaskPriority } from '../types/task-priority.enum';

export class UpdateTaskDto {
  @ApiPropertyOptional({ example: 'Design login page' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({ example: 'Use the new brand colours' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({ enum: TaskPriority })
  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @ApiPropertyOptional({
    example: '64f0a1b2c3d4e5f6a7b8c9d0',
    nullable: true,
    description: 'User id of an existing project member, or null to unassign',
  })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsMongoId()
  assignee?: string | null;

  @ApiPropertyOptional({
    type: String,
    format: 'date-time',
    nullable: true,
    example: '2026-12-31T17:00:00.000Z',
  })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsDateString()
  dueDate?: string | null;
}
