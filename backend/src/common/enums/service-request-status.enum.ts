export enum ServiceRequestStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  MATCHING = 'MATCHING',
  MATCHED = 'MATCHED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
}

/**
 * Transiciones válidas para ServiceRequest.status.
 * Se usa en el servicio de dominio para impedir saltos arbitrarios
 * (ej. CANCELLED -> MATCHED) directamente desde el backend.
 */
export const SERVICE_REQUEST_VALID_TRANSITIONS: Record<ServiceRequestStatus, ServiceRequestStatus[]> = {
  [ServiceRequestStatus.DRAFT]: [ServiceRequestStatus.SUBMITTED, ServiceRequestStatus.CANCELLED],
  [ServiceRequestStatus.SUBMITTED]: [ServiceRequestStatus.MATCHING, ServiceRequestStatus.CANCELLED],
  [ServiceRequestStatus.MATCHING]: [
    ServiceRequestStatus.MATCHED,
    ServiceRequestStatus.EXPIRED,
    ServiceRequestStatus.CANCELLED,
  ],
  [ServiceRequestStatus.MATCHED]: [
    ServiceRequestStatus.IN_PROGRESS,
    ServiceRequestStatus.CANCELLED,
    ServiceRequestStatus.EXPIRED,
  ],
  [ServiceRequestStatus.IN_PROGRESS]: [ServiceRequestStatus.COMPLETED, ServiceRequestStatus.CANCELLED],
  [ServiceRequestStatus.COMPLETED]: [],
  [ServiceRequestStatus.CANCELLED]: [],
  [ServiceRequestStatus.EXPIRED]: [],
};
