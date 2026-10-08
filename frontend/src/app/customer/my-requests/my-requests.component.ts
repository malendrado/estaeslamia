import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ServiceRequestsService } from '../../core/services/service-requests.service';
import { ServiceRequest } from '../../core/models/models';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { LoadingComponent } from '../../shared/components/loading/loading.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../shared/components/error-state/error-state.component';

@Component({
  selector: 'app-my-requests',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    StatusBadgeComponent,
    LoadingComponent,
    EmptyStateComponent,
    ErrorStateComponent,
  ],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1>Mis solicitudes</h1>
          <p class="subtitle">El estado de todo lo que has pedido, en un solo lugar.</p>
        </div>
        @if (requests().length > 0) {
          <a mat-flat-button color="primary" routerLink="/solicitar">
            <mat-icon inline>add</mat-icon>
            Nueva solicitud
          </a>
        }
      </div>

      @if (loading()) {
        <app-loading></app-loading>
      } @else if (hasError()) {
        <app-error-state message="No pudimos cargar tus solicitudes. Intenta recargar la página."></app-error-state>
      } @else if (requests().length === 0) {
        <app-empty-state icon="assignment" message="Todavía no has enviado ninguna solicitud.">
          <a mat-flat-button color="primary" routerLink="/solicitar">Solicitar un servicio</a>
        </app-empty-state>
      } @else {
        <div class="cards">
          @for (req of requests(); track req.id) {
            <a class="card" [routerLink]="['/mis-solicitudes', req.id]">
              <div class="card-icon">
                <mat-icon>{{ req.category?.icon || 'assignment' }}</mat-icon>
              </div>
              <div class="card-body">
                <div class="card-header">
                  <strong>{{ req.service?.name }}</strong>
                  <app-status-badge [status]="req.status"></app-status-badge>
                </div>
                <p class="desc">{{ req.description }}</p>
                <div class="meta">
                  <span><mat-icon inline>location_on</mat-icon> {{ req.commune?.name }}</span>
                  <span><mat-icon inline>calendar_today</mat-icon> {{ req.createdAt | date: 'dd/MM/yyyy' }}</span>
                  @if (req.budgetMin || req.budgetMax) {
                    <span>
                      <mat-icon inline>payments</mat-icon>
                      {{ req.budgetMin | number: '1.0-0' }} - {{ req.budgetMax | number: '1.0-0' }}
                    </span>
                  }
                </div>
              </div>
              <mat-icon class="chevron" inline>chevron_right</mat-icon>
            </a>
          }
        </div>
      }
    </div>
  `,
  styles: [
    `
      .page {
        max-width: 760px;
        margin: 0 auto;
        padding: 2rem 1rem 4rem;
      }
      .page-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        gap: 1rem;
        margin-bottom: 1.5rem;
      }
      h1 {
        margin: 0;
      }
      .subtitle {
        color: #757575;
        margin: 0.25rem 0 0;
      }
      .cards {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }
      .card {
        display: flex;
        align-items: center;
        gap: 1rem;
        background: #fff;
        border: 1px solid #eee;
        border-radius: 12px;
        padding: 1.25rem;
        text-decoration: none;
        color: inherit;
        box-shadow: 0 8px 20px -16px rgba(22, 33, 62, 0.15);
        transition:
          box-shadow 0.15s,
          transform 0.15s;
      }
      .card:hover {
        box-shadow: 0 16px 32px -20px rgba(22, 33, 62, 0.25);
        transform: translateY(-1px);
      }
      .card-icon {
        flex: none;
        width: 44px;
        height: 44px;
        border-radius: 50%;
        background: var(--eslm-primary-light, #e0f2f1);
        color: var(--eslm-primary, #00796b);
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .card-body {
        flex: 1;
        min-width: 0;
      }
      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 0.5rem;
      }
      .desc {
        margin: 0.25rem 0 0.5rem;
        color: #444;
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
      }
      .meta {
        display: flex;
        flex-wrap: wrap;
        gap: 0.25rem 1rem;
        color: #757575;
        font-size: 0.82rem;
      }
      .meta span {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
      }
      .chevron {
        flex: none;
        color: #bbb;
      }

      @media (max-width: 640px) {
        .page-header {
          flex-direction: column;
          align-items: stretch;
        }
        .card {
          align-items: flex-start;
        }
        .chevron {
          display: none;
        }
      }
    `,
  ],
})
export class MyRequestsComponent implements OnInit {
  readonly requests = signal<ServiceRequest[]>([]);
  readonly loading = signal(true);
  readonly hasError = signal(false);

  constructor(private readonly serviceRequestsService: ServiceRequestsService) {}

  ngOnInit(): void {
    this.serviceRequestsService.getMine().subscribe({
      next: (requests) => {
        this.requests.set(requests);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.hasError.set(true);
      },
    });
  }
}
