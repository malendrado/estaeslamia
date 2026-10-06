import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
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
    StatusBadgeComponent,
    LoadingComponent,
    EmptyStateComponent,
    ErrorStateComponent,
  ],
  template: `
    <div class="page">
      <h1>Mis solicitudes</h1>

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
              <div class="card-header">
                <strong>{{ req.service?.name }}</strong>
                <app-status-badge [status]="req.status"></app-status-badge>
              </div>
              <p class="meta">{{ req.commune?.name }} · {{ req.createdAt | date: 'dd/MM/yyyy' }}</p>
              <p class="desc">{{ req.description }}</p>
            </a>
          }
        </div>
      }
    </div>
  `,
  styles: [
    `
      .page {
        max-width: 720px;
        margin: 0 auto;
        padding: 2rem 1rem 4rem;
      }
      .cards {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }
      .card {
        display: block;
        border: 1px solid #eee;
        border-radius: 8px;
        padding: 1rem;
        text-decoration: none;
        color: inherit;
        transition: box-shadow 0.15s;
      }
      .card:hover {
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06);
      }
      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .meta {
        color: #757575;
        font-size: 0.85rem;
        margin: 0.25rem 0;
      }
      .desc {
        margin: 0;
        color: #444;
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
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
