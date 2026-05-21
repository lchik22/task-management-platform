import { Body, Controller, Get, HttpCode, Param, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Types } from 'mongoose';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import type { JwtPayload } from '../auth/types/jwt-payload.type';
import { Role } from '../users/types/role.enum';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { InvitationsService } from './invitations.service';

@ApiTags('invitations')
@ApiBearerAuth()
@Controller('invitations')
@Roles(Role.ADMIN)
export class InvitationsController {
  constructor(private readonly invitations: InvitationsService) {}

  @Post()
  @HttpCode(201)
  @ApiOperation({ summary: 'Create and email an invitation (admin only)' })
  @ApiResponse({ status: 201, description: 'Invitation created and emailed' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 403, description: 'Caller is not an admin' })
  @ApiResponse({
    status: 409,
    description: 'Email already registered or has a pending invitation',
  })
  create(@Body() dto: CreateInvitationDto, @CurrentUser() user: JwtPayload) {
    return this.invitations.create(dto.email, new Types.ObjectId(user.sub));
  }

  @Get()
  @ApiOperation({ summary: 'List all invitations (admin only)' })
  @ApiResponse({ status: 200, description: 'List of invitations' })
  @ApiResponse({ status: 403, description: 'Caller is not an admin' })
  list() {
    return this.invitations.list();
  }

  @Post(':id/revoke')
  @HttpCode(200)
  @ApiOperation({ summary: 'Revoke a pending invitation (admin only)' })
  @ApiResponse({ status: 200, description: 'Invitation revoked' })
  @ApiResponse({ status: 403, description: 'Caller is not an admin' })
  @ApiResponse({ status: 404, description: 'Invitation not found' })
  @ApiResponse({ status: 409, description: 'Invitation cannot be revoked' })
  revoke(@Param('id') id: string) {
    return this.invitations.revoke(id);
  }
}
