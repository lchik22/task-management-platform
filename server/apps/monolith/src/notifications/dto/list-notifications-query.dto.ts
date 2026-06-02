import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class ListNotificationsQueryDto {
  @ApiPropertyOptional({
    description: 'If true, only return unread notifications',
    example: true,
  })
  @IsOptional()
  @Transform(({ value }): boolean | undefined => {
    if (typeof value === 'boolean') return value;
    if (value === 'true') return true;
    if (value === 'false') return false;
    return undefined;
  })
  @IsBoolean()
  unread?: boolean;

  @ApiPropertyOptional({
    description: 'Maximum number of items to return (1-100). Default 20.',
    example: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({
    description:
      "ISO timestamp from the previous page (last item's createdAt). Returns notifications created strictly before it.",
  })
  @IsOptional()
  @IsString()
  cursor?: string;
}
