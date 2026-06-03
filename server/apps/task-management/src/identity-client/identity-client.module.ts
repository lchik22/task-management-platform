import { Module } from '@nestjs/common';
import { IdentityClient } from './identity.client';

@Module({
  providers: [IdentityClient],
  exports: [IdentityClient],
})
export class IdentityClientModule {}
