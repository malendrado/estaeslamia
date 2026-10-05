export enum LeadStatus {
  GENERATED = 'GENERATED',
  DELIVERED = 'DELIVERED',
  VIEWED = 'VIEWED',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  CONTACTED = 'CONTACTED',
  CONVERTED = 'CONVERTED',
  EXPIRED = 'EXPIRED',
}

export const LEAD_VALID_TRANSITIONS: Record<LeadStatus, LeadStatus[]> = {
  [LeadStatus.GENERATED]: [LeadStatus.DELIVERED, LeadStatus.EXPIRED],
  [LeadStatus.DELIVERED]: [LeadStatus.VIEWED, LeadStatus.EXPIRED],
  [LeadStatus.VIEWED]: [LeadStatus.ACCEPTED, LeadStatus.REJECTED, LeadStatus.EXPIRED],
  [LeadStatus.ACCEPTED]: [LeadStatus.CONTACTED, LeadStatus.EXPIRED],
  [LeadStatus.CONTACTED]: [LeadStatus.CONVERTED, LeadStatus.EXPIRED],
  [LeadStatus.REJECTED]: [],
  [LeadStatus.CONVERTED]: [],
  [LeadStatus.EXPIRED]: [],
};
