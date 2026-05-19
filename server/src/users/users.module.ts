import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BootstrapService } from './bootstrap.service';
import { User, UserSchema } from './schemas/user.schema';
import { UsersService } from './users.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  providers: [UsersService, BootstrapService],
  exports: [UsersService, MongooseModule],
})
export class UsersModule {}
