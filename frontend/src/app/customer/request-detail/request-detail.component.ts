import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { ServiceRequestsService, CustomerRequestDetail } from '../../core/services/service-requests.service';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { LoadingComponent } from '../../shared/components/loading/loading.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';

const REASSURANCE_BY_STATUS: Partial<Record<string, string>> = {
  ACCEPTED: 'Esta empresa aceptó tu solicitud y se pondrá en contacto contigo pronto.',
  CONTACTED: 'Esta empresa ya te contactó. Revisa tu teléfono o WhatsApp.',
  CONVERTED: '¡Contrataste a esta empresa a través de EstaEsLaMía!',
  REJECTED: 'Esta empresa no puede tomar tu solicitud en este momento.',
};

@Component({
  selector: 'app-request-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule, StatusBadgeComponent, LoadingComponent, EmptyStateComponent],
  template: `
    <div class="page">
      <a routerLink="/mis-solicitudes" class="back"><mat-icon inline>arrow_back</mat-icon> Volver a mis solicitudes</a>

      @if (loading()) {
        <app-loading></app-loading>
      } @else if (detail()) {
        <div class="summary-card">
          <div class="header">
            <div class="card-icon">
              <mat-icon>{{ detail()!.request.category?.icon || 'assignment' }}</mat-icon>
            </div>
            <div class="header-text">
              <h1>{{ detail()!.request.service?.name }}</h1>
              <div class="meta">
                <span><mat-icon inline>location_on</mat-icon> {{ detail()!.request.commune?.name }}</span>
                <span><mat-icon inline>calendar_today</mat-icon> {{ detail()!.request.createdAt | date: 'dd/MM/yyyy' }}</span>
                @if (detail()!.request.budgetMin || detail()!.request.budgetMax) {
                  <span>
                    <mat-icon inline>payments</mat-icon>
                    {{ detail()!.request.budgetMin | number: '1.0-0' }} - {{ detail()!.request.budgetMax | number: '1.0-0' }}
                  </span>
                }
              </div>
            </div>
            <app-status-badge [status]="detail()!.request.status"></app-status-badge>
          </div>
          <p class="description">{{ detail()!.request.description }}</p>
        </div>

        <h3 class="section-title">
          {{ detail()!.providers.length }}
          {{ detail()!.providers.length === 1 ? 'empresa encontrada' : 'empresas encontradas' }}
        </h3>

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
                @if (reassuranceMessage(p); as message) {
                  <p class="reassurance"><mat-icon inline>info</mat-icon> {{ message }}</p>
                }
                <div class="contact">
                  <p><mat-icon inline>call</mat-icon> {{ p.phone }}</p>
                  @if (p.whatsapp) {
                    <p><mat-icon inline>chat</mat-icon> {{ p.whatsapp }}</p>
                  }
                </div>
              </div>
            }
          </div>
        }
      } @else {
        <app-empty-state icon="error_outline" message="No pudimos cargar esta solicitud."></app-empty-state>
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
      .back {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        margin-bottom: 1.5rem;
        color: #757575;
        text-decoration: none;
        font-size: 0.9rem;
      }
      .summary-card {
        background: #fff;
        border: 1px solid #eee;
        border-radius: 16px;
        box-shadow: 0 16px 32px -20px rgba(22, 33, 62, 0.15);
        padding: 1.75rem;
        margin-bottom: 2rem;
      }
      .header {
        display: flex;
        align-items: flex-start;
        gap: 1rem;
      }
      .card-icon {
        flex: none;
        width: 44px;
        height: 44px;
        border-radius: 50%;
        background: #e0f2f1;
        color: var(--eslm-primary);
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .header-text {
        flex: 1;
        min-width: 0;
      }
      .header-text h1 {
        margin: 0 0 0.25rem;
        font-size: 1.4rem;
      }
      .meta {
        display: flex;
        flex-wrap: wrap;
        gap: 0.25rem 1rem;
        color: #757575;
        font-size: 0.85rem;
      }
      .meta span {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
      }
      .description {
        margin: 1rem 0 0;
        color: #444;
        line-height: 1.5;
      }
      .section-title {
        margin: 0 0 1rem;
      }
      .providers {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }
      .provider-card {
        background: #fff;
        border: 1px solid #eee;
        border-radius: 12px;
        padding: 1.25rem;
        box-shadow: 0 8px 20px -16px rgba(22, 33, 62, 0.15);
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
      .reassurance {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        margin: 0.5rem 0 0;
        padding: 0.5rem 0.75rem;
        background: #e0f2f1;
        color: var(--eslm-primary-dark, #0a5f63);
        border-radius: 8px;
        font-size: 0.85rem;
      }
      .contact {
        margin-top: 0.5rem;
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        font-size: 0.9rem;
        color: #444;
      }
      .contact p {
        margin: 0;
        display: flex;
        align-items: center;
        gap: 0.4rem;
      }

      @media (max-width: 560px) {
        .header {
          flex-wrap: wrap;
        }
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

  reassuranceMessage(provider: { leadStatus: string }): string | null {
    return REASSURANCE_BY_STATUS[provider.leadStatus] ?? null;
  }
}
