import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

/**
 * Gates the service-to-service `/internal/*` endpoints with a shared secret.
 * The gateway never routes `/internal`, so these are reachable only in-network;
 * this header check is defense-in-depth against anything else on the network.
 */
@Injectable()
export class InternalKeyGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const provided = req.headers['x-internal-key'];
    const expected = this.config.getOrThrow<string>('INTERNAL_API_KEY');
    if (provided !== expected) {
      throw new ForbiddenException('Invalid internal API key');
    }
    return true;
  }
}
