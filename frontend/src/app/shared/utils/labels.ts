import { UserRole } from '../../core/models/models';

/**
 * Traducciones de los enums de estado (ServiceRequest/Lead/Provider) usadas
 * en toda la app — fuente única para no duplicar el mapeo en cada componente.
 */
export const STATUS_LABELS: Record<string, string> = {
  // ServiceRequest
  DRAFT: 'Borrador',
  SUBMITTED: 'Enviada',
  MATCHING: 'Buscando empresas',
  MATCHED: 'Empresas encontradas',
  IN_PROGRESS: 'En curso',
  COMPLETED: 'Completada',
  CANCELLED: 'Cancelada',
  EXPIRED: 'Expirada',
  // Lead
  GENERATED: 'Generado',
  DELIVERED: 'Nuevo',
  VIEWED: 'Visto',
  ACCEPTED: 'Aceptado',
  REJECTED: 'Rechazado',
  CONTACTED: 'Contactado',
  CONVERTED: 'Convertido',
  // Provider
  PENDING: 'Pendiente',
  ACTIVE: 'Activo',
  SUSPENDED: 'Suspendido',
};

export const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.CUSTOMER]: 'Cliente',
  [UserRole.PROVIDER]: 'Empresa',
  [UserRole.ADMIN]: 'Administrador',
};
