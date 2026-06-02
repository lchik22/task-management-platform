import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AcceptInvitationDto } from '../invitations/dto/accept-invitation.dto';
import { InvitationsService } from '../invitations/invitations.service';
import { UserDocument } from '../users/schemas/user.schema';
import { Role } from '../users/types/role.enum';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from '@app/auth';

export interface AuthResponse {
  accessToken: string;
  user: UserDocument;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly invitations: InvitationsService,
    private readonly jwt: JwtService,
  ) {}

  async acceptInvitation(dto: AcceptInvitationDto): Promise<AuthResponse> {
    const invitation = await this.invitations.consume(dto.token);

    const user = await this.users.create({
      email: invitation.email,
      password: dto.password,
      firstName: dto.firstName,
      lastName: dto.lastName,
      role: Role.USER,
    });

    return { accessToken: await this.signToken(user), user };
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.users.findByEmailWithPassword(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return { accessToken: await this.signToken(user), user };
  }

  private signToken(user: UserDocument): Promise<string> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    return this.jwt.signAsync(payload);
  }
}
