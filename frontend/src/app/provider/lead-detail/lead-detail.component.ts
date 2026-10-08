import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { LeadsService } from '../../core/services/leads.service';
import { Lead, LeadStatus } from '../../core/models/models';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { LoadingComponent } from '../../shared/components/loading/loading.component';

const NEXT_STATUS_LABEL: Partial<Record<LeadStatus, string>> = {
  [LeadStatus.VIEWED]: 'Marcar como aceptado',
  [LeadStatus.ACCEPTED]: 'Marcar como contactado',
  [LeadStatus.CONTACTED]: 'Marcar como convertido',
};

const NEXT_STATUS: Partial<Record<LeadStatus, LeadStatus>> = {
  [LeadStatus.VIEWED]: LeadStatus.ACCEPTED,
  [LeadStatus.ACCEPTED]: LeadStatus.CONTACTED,
  [LeadStatus.CONTACTED]: LeadStatus.CONVERTED,
};

@Component({
  selector: 'app-provider-lead-detail',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, StatusBadgeComponent, LoadingComponent],
  template: `
    @if (loading()) {
      <app-loading></app-loading>
    } @else if (lead()) {
      <div class="lead-detail">
        <div class="header">
          <div class="card-icon">
            <mat-icon>{{ lead()!.serviceRequest?.category?.icon || 'assignment' }}</mat-icon>
          </div>
          <div class="header-text">
            <h2>{{ lead()!.serviceRequest?.service?.name }}</h2>
            <div class="meta">
              <span><mat-icon inline>location_on</mat-icon> {{ lead()!.serviceRequest?.commune?.name }}</span>
              <span><mat-icon inline>calendar_today</mat-icon> {{ lead()!.createdAt | date: 'dd/MM/yyyy' }}</span>
              @if (lead()!.serviceRequest?.preferredDate) {
                <span><mat-icon inline>event</mat-icon> {{ lead()!.serviceRequest?.preferredDate }}</span>
              }
              @if (lead()!.serviceRequest?.budgetMin || lead()!.serviceRequest?.budgetMax) {
                <span>
                  <mat-icon inline>payments</mat-icon>
                  {{ lead()!.serviceRequest?.budgetMin | number: '1.0-0' }} - {{ lead()!.serviceRequest?.budgetMax | number: '1.0-0' }}
                </span>
              }
            </div>
          </div>
          <app-status-badge [status]="lead()!.status"></app-status-badge>
        </div>

        <p class="description">{{ lead()!.serviceRequest?.description }}</p>

        <h3>Datos de contacto</h3>
        <p><mat-icon inline>person</mat-icon> {{ lead()!.serviceRequest?.contactName }}</p>
        <p><mat-icon inline>mail</mat-icon> {{ lead()!.serviceRequest?.contactEmail }}</p>
        <p><mat-icon inline>call</mat-icon> {{ lead()!.serviceRequest?.contactPhone }}</p>

        @if (errorMessage()) {
          <p class="error" role="alert">{{ errorMessage() }}</p>
        }

        <div class="actions">
          @if (nextAction()) {
            <button mat-flat-button color="primary" (click)="changeStatus(nextAction()!.status)" [disabled]="updating()">
              {{ updating() ? 'Actualizando...' : nextAction()!.label }}
            </button>
          }
          @if (canReject()) {
            <button mat-stroked-button color="warn" (click)="changeStatus(rejectedStatus)" [disabled]="updating()">
              Rechazar
            </button>
          }
        </div>
      </div>
    } @else {
      <p>No pudimos cargar este lead.</p>
    }
  `,
  styles: [
    `
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
      .header-text h2 {
        margin: 0 0 0.25rem;
        font-size: 1.3rem;
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
        margin: 1rem 0 1.5rem;
        color: #444;
        line-height: 1.5;
      }
      h3 {
        margin: 0 0 0.5rem;
        font-size: 1rem;
      }
      .lead-detail p:not(.description) {
        margin: 0.4rem 0;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        color: #444;
      }
      .actions {
        display: flex;
        justify-content: space-between;
        gap: 0.75rem;
        margin-top: 1.5rem;
      }
      .error {
        color: #c62828;
        font-size: 0.85rem;
      }

      @media (max-width: 560px) {
        .header {
          flex-wrap: wrap;
        }
      }
    `,
  ],
})
export class ProviderLeadDetailComponent implements OnInit {
  readonly rejectedStatus = LeadStatus.REJECTED;

  readonly lead = signal<Lead | null>(null);
  readonly loading = signal(true);
  readonly updating = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly nextAction = computed(() => {
    const current = this.lead()?.status;
    if (!current) return null;
    const next = NEXT_STATUS[current];
    if (!next) return null;
    return { status: next, label: NEXT_STATUS_LABEL[current]! };
  });

  // REJECTED solo es una transición válida desde VIEWED (ver LEAD_VALID_TRANSITIONS en el backend).
  readonly canReject = computed(() => this.lead()?.status === LeadStatus.VIEWED);

  constructor(
    private readonly route: ActivatedRoute,
    private readonly leadsService: LeadsService,
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.loading.set(false);
      return;
    }
    this.leadsService.getOneMine(id).subscribe({
      next: (lead) => {
        this.lead.set(lead);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  changeStatus(status: LeadStatus): void {
    const current = this.lead();
    if (!current) return;

    this.updating.set(true);
    this.errorMessage.set(null);
    this.leadsService.updateStatus(current.id, status).subscribe({
      next: (updated) => {
        this.lead.set({ ...current, status: updated.status, contactedAt: updated.contactedAt });
        this.updating.set(false);
      },
      error: () => {
        this.updating.set(false);
        this.errorMessage.set('No pudimos actualizar el estado del lead. Intenta nuevamente.');
      },
    });
  }
}
