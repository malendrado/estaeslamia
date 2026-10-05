import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PaginatedResult, Provider, ProviderStatus } from '../models/models';

const BASE = environment.apiUrl;

@Injectable({ providedIn: 'root' })
export class ProvidersService {
  constructor(private readonly http: HttpClient) {}

  // ---- Público ----
  getFeatured(): Observable<
    Array<{ id: string; businessName: string; description: string | null; logoUrl: string | null; services: string[] }>
  > {
    return this.http.get<
      Array<{ id: string; businessName: string; description: string | null; logoUrl: string | null; services: string[] }>
    >(`${BASE}/providers/featured`);
  }

  // ---- Perfil propio ----
  getMyProfile(): Observable<Provider> {
    return this.http.get<Provider>(`${BASE}/providers/me`);
  }

  updateMyProfile(data: Partial<Provider>): Observable<Provider> {
    return this.http.patch<Provider>(`${BASE}/providers/me`, data);
  }

  uploadLogo(file: File): Observable<Provider> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<Provider>(`${BASE}/providers/me/logo`, formData);
  }

  setMyServices(serviceIds: string[]): Observable<unknown> {
    return this.http.put(`${BASE}/providers/me/services`, { serviceIds });
  }

  setMyCommunes(communeIds: string[]): Observable<unknown> {
    return this.http.put(`${BASE}/providers/me/communes`, { communeIds });
  }

  // ---- Admin ----
  getAllForAdmin(status?: ProviderStatus, page = 1, limit = 20): Observable<PaginatedResult<Provider>> {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    params.set('page', String(page));
    params.set('limit', String(limit));
    return this.http.get<PaginatedResult<Provider>>(`${BASE}/providers?${params.toString()}`);
  }

  getByIdForAdmin(id: string): Observable<Provider> {
    return this.http.get<Provider>(`${BASE}/providers/${id}`);
  }

  updateStatus(id: string, status: ProviderStatus): Observable<Provider> {
    return this.http.patch<Provider>(`${BASE}/providers/${id}/status`, { status });
  }
}
