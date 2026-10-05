export enum ProviderStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  REJECTED = 'REJECTED',
}

export const PROVIDER_VALID_TRANSITIONS: Record<ProviderStatus, ProviderStatus[]> = {
  [ProviderStatus.PENDING]: [ProviderStatus.ACTIVE, ProviderStatus.REJECTED],
  [ProviderStatus.ACTIVE]: [ProviderStatus.SUSPENDED],
  [ProviderStatus.SUSPENDED]: [ProviderStatus.ACTIVE],
  [ProviderStatus.REJECTED]: [ProviderStatus.PENDING],
};
