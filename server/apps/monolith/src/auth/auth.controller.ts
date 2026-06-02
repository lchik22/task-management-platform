import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AcceptInvitationDto } from '../invitations/dto/accept-invitation.dto';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';
import { CurrentUser, Public } from '@app/auth';
import { LoginDto } from './dto/login.dto';
import type { JwtPayload } from '@app/auth';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly users: UsersService,
  ) {}

  @Public()
  @Post('accept-invitation')
  @HttpCode(201)
  @ApiOperation({ summary: 'Complete registration using an invitation token' })
  @ApiResponse({ status: 201, description: 'User created and signed in' })
  @ApiResponse({ status: 400, description: 'Invalid or already used token' })
  @ApiResponse({ status: 409, description: 'Email already registered' })
  @ApiResponse({ status: 410, description: 'Invitation has expired' })
  acceptInvitation(@Body() dto: AcceptInvitationDto) {
    return this.auth.acceptInvitation(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Log in with email and password' })
  @ApiResponse({ status: 200, description: 'Access token issued' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get the currently authenticated user' })
  @ApiResponse({ status: 200, description: 'Current user profile' })
  @ApiResponse({ status: 401, description: 'Missing or invalid token' })
  async me(@CurrentUser() payload: JwtPayload) {
    const user = await this.users.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
