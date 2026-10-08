export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  PROVIDER = 'PROVIDER',
  ADMIN = 'ADMIN',
}

export enum ProviderStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  REJECTED = 'REJECTED',
}

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

export interface User {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: UserRole;
  isActive: boolean;
  hasPassword?: boolean;
  createdAt?: string;
}

export interface AuthResult {
  accessToken: string;
  user: { id: string; email: string; name: string; role: UserRole };
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  isActive: boolean;
  order: number;
}

export interface Service {
  id: string;
  name: string;
  slug: string;
  categoryId: string;
  isActive: boolean;
}

export interface Region {
  id: string;
  name: string;
  code: string;
}

export interface Commune {
  id: string;
  name: string;
  code: string;
  regionId: string;
}

export interface ServiceRequest {
  id: string;
  customerId: string;
  categoryId: string;
  serviceId: string;
  communeId: string;
  description: string;
  address: string | null;
  preferredDate: string | null;
  budgetMin: number | null;
  budgetMax: number | null;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  status: ServiceRequestStatus;
  createdAt: string;
  category?: Category;
  service?: Service;
  commune?: Commune;
}

export interface CreateServiceRequestPayload {
  categoryId: string;
  serviceId: string;
  communeId: string;
  description: string;
  address?: string;
  preferredDate?: string;
  budgetMin?: number;
  budgetMax?: number;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  consentAccepted: boolean;
  turnstileToken?: string;
}

export interface ServiceRequestSummary {
  id: string;
  status: ServiceRequestStatus;
  category?: string;
  service?: string;
  commune?: string;
  createdAt: string;
  matchesCount: number;
}

export interface Provider {
  id: string;
  userId: string;
  businessName: string;
  legalName: string | null;
  rut: string | null;
  description: string | null;
  phone: string;
  email: string;
  website: string | null;
  whatsapp: string | null;
  logoUrl: string | null;
  status: ProviderStatus;
  createdAt: string;
  providerServices?: Array<{ serviceId: string; service?: Service }>;
  providerCommunes?: Array<{ communeId: string; commune?: Commune }>;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface Lead {
  id: string;
  serviceRequestId: string;
  providerId: string;
  status: LeadStatus;
  price: number;
  isPaid: boolean;
  contactedAt: string | null;
  createdAt: string;
  updatedAt: string;
  serviceRequest?: ServiceRequest;
  provider?: Provider;
}
