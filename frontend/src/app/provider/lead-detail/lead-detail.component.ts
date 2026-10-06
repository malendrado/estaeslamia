import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
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
  imports: [CommonModule, RouterLink, MatButtonModule, MatIconModule, StatusBadgeComponent, LoadingComponent],
  template: `
    <a routerLink="/proveedor" class="back">← Volver a mis leads</a>

    @if (loading()) {
      <app-loading></app-loading>
    } @else if (lead()) {
      <div class="lead-detail">
        <div class="header">
          <h2>{{ lead()!.serviceRequest?.service?.name }}</h2>
          <app-status-badge [status]="lead()!.status"></app-status-badge>
        </div>

        <p class="meta">{{ lead()!.serviceRequest?.commune?.name }} · {{ lead()!.createdAt | date: 'dd/MM/yyyy' }}</p>

        <h3>Descripción</h3>
        <p>{{ lead()!.serviceRequest?.description }}</p>

        @if (lead()!.serviceRequest?.preferredDate) {
          <p><strong>Fecha deseada:</strong> {{ lead()!.serviceRequest?.preferredDate }}</p>
        }
        @if (lead()!.serviceRequest?.budgetMin || lead()!.serviceRequest?.budgetMax) {
          <p>
            <strong>Presupuesto:</strong> {{ lead()!.serviceRequest?.budgetMin ?? '—' }} - {{ lead()!.serviceRequest?.budgetMax ?? '—' }}
          </p>
        }

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
      .back {
        display: inline-block;
        margin-bottom: 1rem;
        color: #757575;
        text-decoration: none;
      }
      .lead-detail {
        max-width: 640px;
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
      h3 {
        margin-top: 1.5rem;
        margin-bottom: 0.25rem;
      }
      .actions {
        display: flex;
        gap: 0.75rem;
        margin-top: 1.5rem;
      }
      .error {
        color: #c62828;
        font-size: 0.85rem;
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
