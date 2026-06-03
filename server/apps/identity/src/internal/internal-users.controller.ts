import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { Public } from '@app/auth';
import { UserSummary } from '@app/contracts';
import { UserDocument } from '../users/schemas/user.schema';
import { UsersService } from '../users/users.service';
import { ByIdsDto } from './dto/by-ids.dto';
import { InternalKeyGuard } from './internal-key.guard';

function toSummary(user: UserDocument): UserSummary {
  return {
    id: user.id as string,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
  };
}

/**
 * Service-to-service user lookups (not public API, excluded from Swagger and
 * never routed by the gateway). `@Public()` skips the JWT guard; access is
 * instead gated by the shared-secret InternalKeyGuard.
 */
@ApiExcludeController()
@Controller('internal/users')
@UseGuards(InternalKeyGuard)
export class InternalUsersController {
  constructor(private readonly users: UsersService) {}

  @Public()
  @Get('by-email')
  async byEmail(@Query('email') email?: string): Promise<UserSummary> {
    const user = email ? await this.users.findByEmail(email) : null;
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return toSummary(user);
  }

  @Public()
  @Post('by-ids')
  async byIds(@Body() body: ByIdsDto): Promise<UserSummary[]> {
    const users = await this.users.findByIds(body.ids);
    return users.map(toSummary);
  }
}
