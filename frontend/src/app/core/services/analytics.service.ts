import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export type AnalyticsEventType =
  | 'PAGE_VIEW_HOME'
  | 'WIZARD_STARTED'
  | 'SERVICE_REQUEST_CREATED'
  | 'CUSTOMER_REGISTERED'
  | 'PROVIDER_REGISTERED';

export interface AnalyticsSummary {
  sinceDays: number;
  counts: Record<AnalyticsEventType, number>;
}

/**
 * Tracking propio, sin cookies ni servicios de terceros — solo cuenta eventos
 * agregados para medir el embudo (ver AnalyticsEventType en el backend).
 * Fire-and-forget a propósito: si falla, no debe afectar la experiencia del
 * usuario ni mostrar ningún error.
 */
@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  constructor(private readonly http: HttpClient) {}

  track(eventType: AnalyticsEventType, path?: string): void {
    this.http.post(`${environment.apiUrl}/analytics/event`, { eventType, path }).subscribe({
      error: () => {
        /* intencional: el tracking nunca debe generar un error visible */
      },
    });
  }

  getSummary(days = 30): Observable<AnalyticsSummary> {
    return this.http.get<AnalyticsSummary>(`${environment.apiUrl}/analytics/summary?days=${days}`);
  }
}
