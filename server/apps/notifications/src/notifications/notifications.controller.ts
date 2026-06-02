import { Controller, Get, Param, Patch, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Types } from 'mongoose';
import { CurrentUser, type JwtPayload } from '@app/auth';
import { ListNotificationsQueryDto } from './dto/list-notifications-query.dto';
import { NotificationsService } from './notifications.service';

@ApiTags('notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'List notifications for the current user' })
  @ApiResponse({ status: 200, description: 'Paginated list of notifications' })
  async list(
    @Query() query: ListNotificationsQueryDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.notifications.listForUser(new Types.ObjectId(user.sub), query);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get the count of unread notifications' })
  @ApiResponse({ status: 200, description: 'Unread count' })
  async unreadCount(@CurrentUser() user: JwtPayload) {
    const count = await this.notifications.countUnread(
      new Types.ObjectId(user.sub),
    );
    return { count };
  }

  @Patch('read-all')
  @ApiOperation({
    summary: 'Mark all of the current user notifications as read',
  })
  @ApiResponse({ status: 200, description: 'Number of modified notifications' })
  async markAllRead(@CurrentUser() user: JwtPayload) {
    return this.notifications.markAllRead(new Types.ObjectId(user.sub));
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a single notification as read' })
  @ApiResponse({ status: 200, description: 'Notification updated' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  async markRead(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.notifications.markRead(new Types.ObjectId(user.sub), id);
  }
}
