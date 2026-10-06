import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { ServiceRequestsService, CustomerRequestDetail } from '../../core/services/service-requests.service';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { LoadingComponent } from '../../shared/components/loading/loading.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-request-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule, StatusBadgeComponent, LoadingComponent, EmptyStateComponent],
  template: `
    <div class="page">
      <a routerLink="/mis-solicitudes" class="back">← Volver a mis solicitudes</a>

      @if (loading()) {
        <app-loading></app-loading>
      } @else if (detail()) {
        <div class="header">
          <h1>{{ detail()!.request.service?.name }}</h1>
          <app-status-badge [status]="detail()!.request.status"></app-status-badge>
        </div>
        <p class="meta">{{ detail()!.request.commune?.name }} · {{ detail()!.request.createdAt | date: 'dd/MM/yyyy' }}</p>
        <p>{{ detail()!.request.description }}</p>

        <h3>{{ detail()!.providers.length }} {{ detail()!.providers.length === 1 ? 'empresa encontrada' : 'empresas encontradas' }}</h3>

        @if (detail()!.providers.length === 0) {
          <app-empty-state icon="storefront" message="Aún no hemos encontrado empresas para esta solicitud."></app-empty-state>
        } @else {
          <div class="providers">
            @for (p of detail()!.providers; track p.id) {
              <div class="provider-card">
                <div class="provider-card-header">
                  <strong>{{ p.businessName }}</strong>
                  <app-status-badge [status]="p.leadStatus"></app-status-badge>
                </div>
                @if (p.description) {
                  <p class="desc">{{ p.description }}</p>
                }
                <p><mat-icon inline>call</mat-icon> {{ p.phone }}</p>
                @if (p.whatsapp) {
                  <p><mat-icon inline>chat</mat-icon> {{ p.whatsapp }}</p>
                }
              </div>
            }
          </div>
        }
      } @else {
        <p>No pudimos cargar esta solicitud.</p>
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
      .back {
        display: inline-block;
        margin-bottom: 1rem;
        color: #757575;
        text-decoration: none;
      }
      .header {
        display: flex;
        align-items: center;
        gap: 1rem;
      }
      .meta {
        color: #757575;
        margin-top: -0.5rem;
      }
      .providers {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
        gap: 1rem;
      }
      .provider-card {
        border: 1px solid #eee;
        border-radius: 8px;
        padding: 1rem;
      }
      .provider-card-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.5rem;
        margin-bottom: 0.25rem;
      }
      .desc {
        color: #555;
        font-size: 0.9rem;
      }
    `,
  ],
})
export class RequestDetailComponent implements OnInit {
  readonly detail = signal<CustomerRequestDetail | null>(null);
  readonly loading = signal(true);

  constructor(
    private readonly route: ActivatedRoute,
    private readonly serviceRequestsService: ServiceRequestsService,
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.loading.set(false);
      return;
    }
    this.serviceRequestsService.getMineDetail(id).subscribe({
      next: (detail) => {
        this.detail.set(detail);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
