import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Category, Commune, Region, Service } from '../models/models';

const BASE = environment.apiUrl;

@Injectable({ providedIn: 'root' })
export class CatalogService {
  constructor(private readonly http: HttpClient) {}

  getPublicStats(): Observable<{ categoriesCount: number; servicesCount: number; activeProvidersCount: number; communesCoveredCount: number }> {
    return this.http.get<{ categoriesCount: number; servicesCount: number; activeProvidersCount: number; communesCoveredCount: number }>(
      `${BASE}/stats/public`,
    );
  }

  // ---- Categories ----
  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${BASE}/categories`);
  }

  getCategoriesForAdmin(): Observable<Category[]> {
    return this.http.get<Category[]>(`${BASE}/categories/admin/all`);
  }

  getCategoryBySlug(slug: string): Observable<Category> {
    return this.http.get<Category>(`${BASE}/categories/${slug}`);
  }

  createCategory(data: { name: string; icon?: string }): Observable<Category> {
    return this.http.post<Category>(`${BASE}/categories`, data);
  }

  updateCategory(id: string, data: Partial<{ name: string; icon: string; isActive: boolean; order: number }>): Observable<Category> {
    return this.http.patch<Category>(`${BASE}/categories/${id}`, data);
  }

  deactivateCategory(id: string): Observable<void> {
    return this.http.delete<void>(`${BASE}/categories/${id}`);
  }

  // ---- Services ----
  getServices(categoryId?: string): Observable<Service[]> {
    const url = categoryId ? `${BASE}/services?categoryId=${categoryId}` : `${BASE}/services`;
    return this.http.get<Service[]>(url);
  }

  getServiceBySlug(slug: string): Observable<Service> {
    return this.http.get<Service>(`${BASE}/services/${slug}`);
  }

  getServicesForAdmin(): Observable<Service[]> {
    return this.http.get<Service[]>(`${BASE}/services/admin/all`);
  }

  createService(data: { name: string; categoryId: string }): Observable<Service> {
    return this.http.post<Service>(`${BASE}/services`, data);
  }

  updateService(id: string, data: Partial<{ name: string; categoryId: string; isActive: boolean }>): Observable<Service> {
    return this.http.patch<Service>(`${BASE}/services/${id}`, data);
  }

  deactivateService(id: string): Observable<void> {
    return this.http.delete<void>(`${BASE}/services/${id}`);
  }

  // ---- Regions & communes ----
  getRegions(): Observable<Region[]> {
    return this.http.get<Region[]>(`${BASE}/regions`);
  }

  getCommunes(regionId?: string): Observable<Commune[]> {
    const url = regionId ? `${BASE}/communes?regionId=${regionId}` : `${BASE}/communes`;
    return this.http.get<Commune[]>(url);
  }
}
