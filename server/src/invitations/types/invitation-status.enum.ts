export enum InvitationStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REVOKED = 'REVOKED',
  EXPIRED = 'EXPIRED',
}

export type PersistedInvitationStatus = Exclude<
  InvitationStatus,
  InvitationStatus.EXPIRED
>;
