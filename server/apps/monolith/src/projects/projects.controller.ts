import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Types } from 'mongoose';
import { CurrentUser, type JwtPayload } from '@app/auth';
import { CreateProjectInvitationDto } from './dto/create-project-invitation.dto';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectsService } from './projects.service';

@ApiTags('projects')
@ApiBearerAuth()
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projects: ProjectsService) {}

  @Post()
  @HttpCode(201)
  @ApiOperation({ summary: 'Create a project (caller becomes OWNER)' })
  @ApiResponse({ status: 201, description: 'Project created' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  create(@Body() dto: CreateProjectDto, @CurrentUser() user: JwtPayload) {
    return this.projects.create(dto, new Types.ObjectId(user.sub));
  }

  @Get()
  @ApiOperation({ summary: 'List projects the current user is a member of' })
  @ApiResponse({ status: 200, description: 'List of projects with role' })
  async list(@CurrentUser() user: JwtPayload) {
    const items = await this.projects.listForUser(new Types.ObjectId(user.sub));
    return items.map(({ project, role }) => ({
      ...project.toJSON(),
      role,
    }));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a project the current user is a member of' })
  @ApiResponse({ status: 200, description: 'Project details' })
  @ApiResponse({ status: 403, description: 'Caller is not a member' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  get(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.projects.findByIdForUser(id, new Types.ObjectId(user.sub));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a project (owner only)' })
  @ApiResponse({ status: 200, description: 'Project updated' })
  @ApiResponse({ status: 403, description: 'Caller is not the owner' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateProjectDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.projects.update(id, dto, new Types.ObjectId(user.sub));
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete a project (owner only)' })
  @ApiResponse({ status: 204, description: 'Project deleted' })
  @ApiResponse({ status: 403, description: 'Caller is not the owner' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    await this.projects.remove(id, new Types.ObjectId(user.sub));
  }

  @Post(':id/leave')
  @HttpCode(200)
  @ApiOperation({ summary: 'Leave a project (members only — not owner)' })
  @ApiResponse({ status: 200, description: 'Left the project' })
  @ApiResponse({ status: 400, description: 'Owner cannot leave the project' })
  @ApiResponse({ status: 403, description: 'Caller is not a member' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async leave(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    await this.projects.leave(id, new Types.ObjectId(user.sub));
    return { success: true };
  }

  @Delete(':id/members/:userId')
  @HttpCode(204)
  @ApiOperation({ summary: 'Remove a member from a project (owner only)' })
  @ApiResponse({ status: 204, description: 'Member removed' })
  @ApiResponse({ status: 400, description: 'Cannot remove the owner' })
  @ApiResponse({ status: 403, description: 'Caller is not the owner' })
  @ApiResponse({ status: 404, description: 'Project or member not found' })
  async removeMember(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.projects.removeMember(id, userId, new Types.ObjectId(user.sub));
  }

  @Post(':id/invitations')
  @HttpCode(201)
  @ApiOperation({
    summary: 'Invite a registered user to a project (owner only)',
  })
  @ApiResponse({ status: 201, description: 'Invitation created' })
  @ApiResponse({ status: 403, description: 'Caller is not the owner' })
  @ApiResponse({ status: 404, description: 'Project or user not found' })
  @ApiResponse({
    status: 409,
    description: 'User is already a member or has a pending invitation',
  })
  createInvitation(
    @Param('id') id: string,
    @Body() dto: CreateProjectInvitationDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.projects.createInvitation(
      id,
      dto.email,
      new Types.ObjectId(user.sub),
    );
  }

  @Get(':id/invitations')
  @ApiOperation({ summary: 'List project invitations (owner only)' })
  @ApiResponse({ status: 200, description: 'List of invitations' })
  @ApiResponse({ status: 403, description: 'Caller is not the owner' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  listInvitations(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.projects.listInvitations(id, new Types.ObjectId(user.sub));
  }

  @Delete(':id/invitations/:invitationId')
  @HttpCode(200)
  @ApiOperation({ summary: 'Revoke a pending project invitation (owner only)' })
  @ApiResponse({ status: 200, description: 'Invitation revoked' })
  @ApiResponse({ status: 400, description: 'Invitation is not pending' })
  @ApiResponse({ status: 403, description: 'Caller is not the owner' })
  @ApiResponse({ status: 404, description: 'Project or invitation not found' })
  revokeInvitation(
    @Param('id') id: string,
    @Param('invitationId') invitationId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.projects.revokeInvitation(
      id,
      invitationId,
      new Types.ObjectId(user.sub),
    );
  }
}
