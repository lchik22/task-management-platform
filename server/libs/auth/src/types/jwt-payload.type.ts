/**
 * Decoded JWT claims shared across services for edge verification.
 * `role` is intentionally typed as `string` (not the monolith's `Role` enum)
 * so this lib stays decoupled from the users domain — same approach as the
 * Kafka contract widening TaskStatus to string.
 */
export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}
