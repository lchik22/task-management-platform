import { Controller, Get, HttpCode, Param, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Types } from 'mongoose';
import { CurrentUser, type JwtPayload } from '@app/auth';
import { ProjectsService } from './projects.service';

@ApiTags('my-project-invitations')
@ApiBearerAuth()
@Controller('me/project-invitations')
export class MyProjectInvitationsController {
  constructor(private readonly projects: ProjectsService) {}

  @Get()
  @ApiOperation({ summary: 'List my pending project invitations' })
  @ApiResponse({ status: 200, description: 'List of pending invitations' })
  list(@CurrentUser() user: JwtPayload) {
    return this.projects.listMyPendingInvitations(new Types.ObjectId(user.sub));
  }

  @Post(':invitationId/accept')
  @HttpCode(200)
  @ApiOperation({ summary: 'Accept a pending project invitation' })
  @ApiResponse({ status: 200, description: 'Invitation accepted' })
  @ApiResponse({ status: 400, description: 'Invitation is not pending' })
  @ApiResponse({ status: 404, description: 'Invitation not found' })
  accept(
    @Param('invitationId') invitationId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.projects.acceptMyInvitation(
      invitationId,
      new Types.ObjectId(user.sub),
    );
  }

  @Post(':invitationId/decline')
  @HttpCode(200)
  @ApiOperation({ summary: 'Decline a pending project invitation' })
  @ApiResponse({ status: 200, description: 'Invitation declined' })
  @ApiResponse({ status: 400, description: 'Invitation is not pending' })
  @ApiResponse({ status: 404, description: 'Invitation not found' })
  decline(
    @Param('invitationId') invitationId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.projects.declineMyInvitation(
      invitationId,
      new Types.ObjectId(user.sub),
    );
  }
}
