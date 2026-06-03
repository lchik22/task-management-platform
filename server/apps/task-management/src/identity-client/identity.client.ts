import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserSummary } from '@app/contracts';

/**
 * Thin HTTP client for Identity's internal user-lookup API. Replaces the
 * cross-collection Mongoose joins (`.populate()` / `findByEmail`) that existed
 * while users lived in the same database. Uses Node's global fetch (no new dep)
 * and presents the shared INTERNAL_API_KEY on every call.
 */
@Injectable()
export class IdentityClient {
  private readonly logger = new Logger(IdentityClient.name);
  private readonly baseUrl: string;
  private readonly internalKey: string;

  constructor(config: ConfigService) {
    this.baseUrl = config
      .getOrThrow<string>('IDENTITY_URL')
      .replace(/\/+$/, '');
    this.internalKey = config.getOrThrow<string>('INTERNAL_API_KEY');
  }

  async findByEmail(email: string): Promise<UserSummary | null> {
    const res = await this.request(
      `/internal/users/by-email?email=${encodeURIComponent(email)}`,
      { method: 'GET' },
    );
    if (res.status === 404) return null;
    if (!res.ok) throw this.fail('findByEmail', res.status);
    return (await res.json()) as UserSummary;
  }

  async findByIds(ids: string[]): Promise<UserSummary[]> {
    const unique = [...new Set(ids.filter((id) => !!id))];
    if (unique.length === 0) return [];
    const res = await this.request('/internal/users/by-ids', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: unique }),
    });
    if (!res.ok) throw this.fail('findByIds', res.status);
    return (await res.json()) as UserSummary[];
  }

  private async request(
    path: string,
    init: { method: string; headers?: Record<string, string>; body?: string },
  ): Promise<Response> {
    try {
      return await fetch(`${this.baseUrl}${path}`, {
        ...init,
        headers: { ...(init.headers ?? {}), 'x-internal-key': this.internalKey },
      });
    } catch (err) {
      this.logger.error(`Identity request failed: ${path}`, err as Error);
      throw new ServiceUnavailableException('Identity service unavailable');
    }
  }

  private fail(op: string, status: number): ServiceUnavailableException {
    this.logger.error(`Identity ${op} returned HTTP ${status}`);
    return new ServiceUnavailableException('Identity service error');
  }
}
