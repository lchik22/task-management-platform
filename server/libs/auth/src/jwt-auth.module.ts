import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { PassportModule } from '@nestjs/passport';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtStrategy } from './strategies/jwt.strategy';

/**
 * Drop-in JWT edge verification for any app in the monorepo. Registers the
 * passport-jwt strategy and a global JwtAuthGuard so every route is protected
 * by default; opt a handler out with @Public(). Relies on a global
 * ConfigModule (for JWT_SECRET) being present in the host app.
 */
@Module({
  imports: [PassportModule.register({ defaultStrategy: 'jwt' })],
  providers: [JwtStrategy, { provide: APP_GUARD, useClass: JwtAuthGuard }],
})
export class JwtAuthModule {}
