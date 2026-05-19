import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Role } from './types/role.enum';
import { UsersService } from './users.service';

@Injectable()
export class BootstrapService implements OnApplicationBootstrap {
  private readonly logger = new Logger(BootstrapService.name);

  constructor(
    private readonly users: UsersService,
    private readonly config: ConfigService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const email = this.config.getOrThrow<string>('ADMIN_EMAIL');

    if (await this.users.existsByEmail(email)) {
      this.logger.log(`Admin user already present: ${email}`);
      return;
    }

    await this.users.create({
      email,
      password: this.config.getOrThrow<string>('ADMIN_PASSWORD'),
      firstName: 'Platform',
      lastName: 'Admin',
      role: Role.ADMIN,
    });

    this.logger.log(`Seeded admin user: ${email}`);
  }
}
