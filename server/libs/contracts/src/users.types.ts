/**
 * Minimal user projection returned by Identity's internal user-lookup API and
 * consumed by other services (e.g. the monolith hydrating project invitations).
 * Never includes the password hash.
 */
export interface UserSummary {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}
