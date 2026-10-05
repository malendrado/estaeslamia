import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CreateServiceRequestPayload,
  PaginatedResult,
  ServiceRequest,
  ServiceRequestStatus,
  ServiceRequestSummary,
} from '../models/models';

const BASE = environment.apiUrl;

export interface CreateServiceRequestResponse {
  id: string;
  status: ServiceRequestStatus;
  matchesCount: number;
}

export interface CustomerRequestDetail {
  request: ServiceRequest;
  providers: Array<{ leadStatus: string; id: string; businessName: string; phone: string; whatsapp: string | null; description: string | null }>;
}

@Injectable({ providedIn: 'root' })
export class ServiceRequestsService {
  constructor(private readonly http: HttpClient) {}

  create(payload: CreateServiceRequestPayload): Observable<CreateServiceRequestResponse> {
    return this.http.post<CreateServiceRequestResponse>(`${BASE}/service-requests`, payload);
  }

  getPublicSummary(id: string): Observable<ServiceRequestSummary> {
    return this.http.get<ServiceRequestSummary>(`${BASE}/service-requests/${id}/summary`);
  }

  // ---- Customer (autenticado) ----
  getMine(): Observable<ServiceRequest[]> {
    return this.http.get<ServiceRequest[]>(`${BASE}/service-requests/mine`);
  }

  getMineDetail(id: string): Observable<CustomerRequestDetail> {
    return this.http.get<CustomerRequestDetail>(`${BASE}/service-requests/mine/${id}`);
  }

  // ---- Admin ----
  getAllForAdmin(
    filters: { status?: string; serviceId?: string; communeId?: string; page?: number; limit?: number } = {},
  ): Observable<PaginatedResult<ServiceRequest>> {
    const params = new URLSearchParams();
    if (filters.status) params.set('status', filters.status);
    if (filters.serviceId) params.set('serviceId', filters.serviceId);
    if (filters.communeId) params.set('communeId', filters.communeId);
    params.set('page', String(filters.page ?? 1));
    params.set('limit', String(filters.limit ?? 20));
    return this.http.get<PaginatedResult<ServiceRequest>>(`${BASE}/service-requests?${params.toString()}`);
  }

  getByIdForAdmin(id: string): Observable<ServiceRequest> {
    return this.http.get<ServiceRequest>(`${BASE}/service-requests/${id}`);
  }

  updateStatus(id: string, status: ServiceRequestStatus): Observable<ServiceRequest> {
    return this.http.patch<ServiceRequest>(`${BASE}/service-requests/${id}/status`, { status });
  }
}
