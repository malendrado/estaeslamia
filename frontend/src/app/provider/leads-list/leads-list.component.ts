import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { LeadsService } from '../../core/services/leads.service';
import { Lead, LeadStatus } from '../../core/models/models';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { LoadingComponent } from '../../shared/components/loading/loading.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../shared/components/error-state/error-state.component';

@Component({
  selector: 'app-provider-leads-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatButtonModule,
    MatChipsModule,
    StatusBadgeComponent,
    LoadingComponent,
    EmptyStateComponent,
    ErrorStateComponent,
  ],
  template: `
    <div class="summary-cards">
      <div class="card" style="border-top-color: var(--eslm-primary)">
        <span class="value" style="color: var(--eslm-primary)">{{ counts().delivered }}</span>
        <span class="label">Nuevos</span>
      </div>
      <div class="card" style="border-top-color: var(--eslm-accent-3)">
        <span class="value" style="color: var(--eslm-accent-3)">{{ counts().total }}</span>
        <span class="label">Recibidos</span>
      </div>
      <div class="card" style="border-top-color: var(--eslm-accent-2)">
        <span class="value" style="color: var(--eslm-accent-2-ink)">{{ counts().contacted }}</span>
        <span class="label">Contactados</span>
      </div>
      <div class="card" style="border-top-color: var(--eslm-accent)">
        <span class="value" style="color: var(--eslm-accent-ink)">{{ counts().converted }}</span>
        <span class="label">Convertidos</span>
      </div>
    </div>

    @if (loading()) {
      <app-loading></app-loading>
    } @else if (hasError()) {
      <app-error-state message="No pudimos cargar tus leads. Intenta recargar la página."></app-error-state>
    } @else if (leads().length === 0) {
      <app-empty-state icon="inbox" message="Todavía no tienes leads. Aparecerán aquí cuando un cliente busque tus servicios.">
      </app-empty-state>
    } @else {
      <div class="table-scroll">
      <table class="leads-table">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Servicio</th>
            <th>Comuna</th>
            <th>Descripción</th>
            <th>Estado</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          @for (lead of leads(); track lead.id) {
            <tr>
              <td>{{ lead.createdAt | date: 'dd/MM/yyyy' }}</td>
              <td>{{ lead.serviceRequest?.service?.name ?? '—' }}</td>
              <td>{{ lead.serviceRequest?.commune?.name ?? '—' }}</td>
              <td class="desc">{{ lead.serviceRequest?.description }}</td>
              <td><app-status-badge [status]="lead.status"></app-status-badge></td>
              <td><a mat-button [routerLink]="['/proveedor/leads', lead.id]">Ver</a></td>
            </tr>
          }
        </tbody>
      </table>
      </div>
    }
  `,
  styles: [
    `
      .summary-cards {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
        gap: 1rem;
        margin-bottom: 2rem;
      }
      .card {
        background: #fff;
        border: 1px solid #eee;
        border-top: 3px solid transparent;
        border-radius: 8px;
        padding: 1rem;
        display: flex;
        flex-direction: column;
        align-items: center;
        transition: transform 0.15s ease, box-shadow 0.15s ease;
      }
      .card:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 20px -14px rgba(22, 33, 62, 0.25);
      }
      .card .value {
        font-size: 1.8rem;
        font-weight: 700;
        font-family: var(--eslm-font-display);
      }
      .card .label {
        font-size: 0.8rem;
        color: #757575;
      }
      .table-scroll {
        overflow-x: auto;
        border: 1px solid #eee;
        border-radius: 12px;
      }
      .leads-table {
        width: 100%;
        min-width: 600px;
        border-collapse: collapse;
      }
      .leads-table th {
        text-align: left;
        font-size: 0.8rem;
        color: #757575;
        border-bottom: 1px solid #eee;
        padding: 0.5rem;
      }
      .leads-table td {
        padding: 0.6rem 0.5rem;
        border-bottom: 1px solid #f2f2f2;
        vertical-align: top;
      }
      .leads-table tbody tr {
        transition: background 0.1s ease;
      }
      .leads-table tbody tr:hover {
        background: #fafaf8;
      }
      .leads-table tr:last-child td {
        border-bottom: none;
      }
      .desc {
        max-width: 280px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    `,
  ],
})
export class ProviderLeadsListComponent implements OnInit {
  readonly leads = signal<Lead[]>([]);
  readonly loading = signal(true);
  readonly hasError = signal(false);

  readonly counts = computed(() => {
    const all = this.leads();
    return {
      total: all.length,
      delivered: all.filter((l) => l.status === LeadStatus.DELIVERED).length,
      contacted: all.filter((l) => l.status === LeadStatus.CONTACTED).length,
      converted: all.filter((l) => l.status === LeadStatus.CONVERTED).length,
    };
  });

  constructor(private readonly leadsService: LeadsService) {}

  ngOnInit(): void {
    this.leadsService.getMine().subscribe({
      next: (leads) => {
        this.leads.set(leads);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.hasError.set(true);
      },
    });
  }
}
