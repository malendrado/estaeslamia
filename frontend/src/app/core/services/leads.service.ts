import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Lead, LeadStatus, PaginatedResult } from '../models/models';

const BASE = environment.apiUrl;

@Injectable({ providedIn: 'root' })
export class LeadsService {
  constructor(private readonly http: HttpClient) {}

  // ---- Provider ----
  getMine(status?: LeadStatus): Observable<Lead[]> {
    const url = status ? `${BASE}/leads/mine?status=${status}` : `${BASE}/leads/mine`;
    return this.http.get<Lead[]>(url);
  }

  getOneMine(id: string): Observable<Lead> {
    return this.http.get<Lead>(`${BASE}/leads/mine/${id}`);
  }

  updateStatus(id: string, status: LeadStatus): Observable<Lead> {
    return this.http.patch<Lead>(`${BASE}/leads/mine/${id}/status`, { status });
  }

  // ---- Admin ----
  getAllForAdmin(
    filters: { status?: string; providerId?: string; page?: number; limit?: number } = {},
  ): Observable<PaginatedResult<Lead>> {
    const params = new URLSearchParams();
    if (filters.status) params.set('status', filters.status);
    if (filters.providerId) params.set('providerId', filters.providerId);
    params.set('page', String(filters.page ?? 1));
    params.set('limit', String(filters.limit ?? 20));
    return this.http.get<PaginatedResult<Lead>>(`${BASE}/leads?${params.toString()}`);
  }

  getByIdForAdmin(id: string): Observable<Lead> {
    return this.http.get<Lead>(`${BASE}/leads/${id}`);
  }
}
