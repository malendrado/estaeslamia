import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PaginatedResult, User, UserRole } from '../models/models';

const BASE = environment.apiUrl;

@Injectable({ providedIn: 'root' })
export class UsersService {
  constructor(private readonly http: HttpClient) {}

  getAllForAdmin(
    filters: { role?: UserRole; isActive?: boolean; page?: number; limit?: number } = {},
  ): Observable<PaginatedResult<User>> {
    const params = new URLSearchParams();
    if (filters.role) params.set('role', filters.role);
    if (filters.isActive !== undefined) params.set('isActive', String(filters.isActive));
    params.set('page', String(filters.page ?? 1));
    params.set('limit', String(filters.limit ?? 20));
    return this.http.get<PaginatedResult<User>>(`${BASE}/users?${params.toString()}`);
  }

  setActiveStatus(id: string, isActive: boolean): Observable<User> {
    return this.http.patch<User>(`${BASE}/users/${id}/status`, { isActive });
  }
}
