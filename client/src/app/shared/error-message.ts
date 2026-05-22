import { HttpErrorResponse } from '@angular/common/http';

export function toErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof HttpErrorResponse) {
    const body = err.error as { message?: string | string[] } | null;
    if (body?.message) {
      return Array.isArray(body.message) ? body.message.join(', ') : body.message;
    }
    if (err.status === 0) return 'Cannot reach the server.';
  }
  return fallback;
}
