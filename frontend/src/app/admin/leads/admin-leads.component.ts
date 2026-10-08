import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialog } from '@angular/material/dialog';
import { LeadsService } from '../../core/services/leads.service';
import { Lead, LeadStatus } from '../../core/models/models';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { LoadingComponent } from '../../shared/components/loading/loading.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../shared/components/error-state/error-state.component';
import { PagerComponent } from '../../shared/components/pager/pager.component';
import { STATUS_LABELS } from '../../shared/utils/labels';
import { formatBudgetRange, formatDateTime } from '../../shared/utils/format';
import { AdminDetailDialogComponent } from '../../shared/components/admin-detail-dialog/admin-detail-dialog.component';
import { PageLoaderComponent } from '../../shared/components/page-loader/page-loader.component';

const ALL_STATUSES = Object.values(LeadStatus);
const PAGE_SIZE = 20;

@Component({
  selector: 'app-admin-leads',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatSelectModule,
    MatFormFieldModule,
    StatusBadgeComponent,
    LoadingComponent,
    EmptyStateComponent,
    ErrorStateComponent,
    PagerComponent,
    PageLoaderComponent,
  ],
  template: `
    <app-page-loader [visible]="!!loadingDetailId()"></app-page-loader>
    <p class="tab-description">Leads generados por el motor de matching: qué empresa recibió cada solicitud y en qué estado está su seguimiento.</p>

    <div class="filters">
      <mat-form-field appearance="outline">
        <mat-label>Filtrar por estado</mat-label>
        <mat-select [(ngModel)]="statusFilter" (selectionChange)="goToPage(1)">
          <mat-option [value]="undefined">Todos</mat-option>
          @for (s of statuses; track s) {
            <mat-option [value]="s">{{ statusLabels[s] ?? s }}</mat-option>
          }
        </mat-select>
      </mat-form-field>
    </div>

    @if (loading()) {
      <app-loading></app-loading>
    } @else if (hasError()) {
      <app-error-state message="No pudimos cargar los leads. Intenta recargar la página."></app-error-state>
    } @else if (leads().length === 0) {
      <app-empty-state icon="local_offer" message="No hay leads con este filtro."></app-empty-state>
    } @else {
      <div class="table-scroll">
      <table class="data-table">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Empresa</th>
            <th>Servicio</th>
            <th>Comuna</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          @for (lead of leads(); track lead.id) {
            <tr class="clickable-row" (click)="openDetail(lead)">
              <td>{{ lead.createdAt | date: 'dd/MM/yyyy' }}</td>
              <td>{{ lead.provider?.businessName }}</td>
              <td>{{ lead.serviceRequest?.service?.name }}</td>
              <td>{{ lead.serviceRequest?.commune?.name }}</td>
              <td><app-status-badge [status]="lead.status"></app-status-badge></td>
            </tr>
          }
        </tbody>
      </table>
      </div>
      <app-pager [page]="page()" [total]="total()" [limit]="PAGE_SIZE" (pageChange)="goToPage($event)"></app-pager>
    }
  `,
  styles: [
    `
      .filters {
        margin-bottom: 1rem;
        max-width: 260px;
      }
      .table-scroll {
        overflow-x: auto;
        border: 1px solid #eee;
        border-radius: 12px;
      }
      .data-table tbody tr {
        transition: background 0.1s ease;
      }
      .data-table tbody tr:hover {
        background: #fafaf8;
      }
      .clickable-row {
        cursor: pointer;
      }
      .data-table tr:last-child td {
        border-bottom: none;
      }
      .data-table {
        width: 100%;
        min-width: 560px;
        border-collapse: collapse;
      }
      .data-table th {
        text-align: left;
        font-size: 0.8rem;
        color: #757575;
        border-bottom: 1px solid #eee;
        padding: 0.5rem;
      }
      .data-table td {
        padding: 0.6rem 0.5rem;
        border-bottom: 1px solid #f2f2f2;
        font-size: 0.9rem;
      }
    `,
  ],
})
export class AdminLeadsComponent implements OnInit {
  private readonly dialog = inject(MatDialog);

  readonly PAGE_SIZE = PAGE_SIZE;
  readonly statuses = ALL_STATUSES;
  readonly statusLabels = STATUS_LABELS;
  readonly leads = signal<Lead[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly loading = signal(true);
  readonly hasError = signal(false);
  readonly loadingDetailId = signal<string | null>(null);
  statusFilter: LeadStatus | undefined;

  constructor(private readonly leadsService: LeadsService) {}

  ngOnInit(): void {
    this.reload();
  }

  goToPage(page: number): void {
    this.page.set(page);
    this.reload();
  }

  reload(): void {
    this.loading.set(true);
    this.hasError.set(false);
    this.leadsService.getAllForAdmin({ status: this.statusFilter, page: this.page(), limit: PAGE_SIZE }).subscribe({
      next: (result) => {
        this.leads.set(result.data);
        this.total.set(result.total);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.hasError.set(true);
      },
    });
  }

  openDetail(row: Lead): void {
    if (this.loadingDetailId()) return;
    this.loadingDetailId.set(row.id);
    this.leadsService.getByIdForAdmin(row.id).subscribe({
      next: (lead) => {
      this.loadingDetailId.set(null);
      const sr = lead.serviceRequest;
      this.dialog.open(AdminDetailDialogComponent, {
        width: '560px',
        maxWidth: '95vw',
        autoFocus: false,
        data: {
          title: lead.provider?.businessName ?? 'Lead',
          subtitle: sr?.service?.name,
          status: lead.status,
          sections: [
            {
              label: 'Solicitud',
              fields: [
                { label: 'Categoría', value: sr?.category?.name ?? '' },
                { label: 'Servicio', value: sr?.service?.name ?? '' },
                { label: 'Comuna', value: sr?.commune?.name ?? '' },
              ],
            },
            {
              label: 'Detalle',
              fields: [
                { label: 'Descripción', value: sr?.description ?? '' },
                { label: 'Presupuesto', value: formatBudgetRange(sr?.budgetMin, sr?.budgetMax) },
                { label: 'Dirección', value: sr?.address ?? '' },
              ],
            },
            {
              label: 'Contacto',
              fields: [
                { label: 'Nombre', value: sr?.contactName ?? '' },
                { label: 'Email', value: sr?.contactEmail ?? '' },
                { label: 'Teléfono', value: sr?.contactPhone ?? '' },
              ],
            },
            {
              label: 'Seguimiento',
              fields: [
                { label: 'Lead generado', value: formatDateTime(lead.createdAt) },
                { label: 'Contactado el', value: formatDateTime(lead.contactedAt) },
              ],
            },
          ],
        },
        });
      },
      error: () => this.loadingDetailId.set(null),
    });
  }
}
