import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { InternalKeyGuard } from './internal-key.guard';
import { InternalUsersController } from './internal-users.controller';

@Module({
  imports: [UsersModule],
  controllers: [InternalUsersController],
  providers: [InternalKeyGuard],
})
export class InternalUsersModule {}
