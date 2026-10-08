import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialog } from '@angular/material/dialog';
import { ServiceRequestsService } from '../../core/services/service-requests.service';
import { ServiceRequest, ServiceRequestStatus } from '../../core/models/models';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { LoadingComponent } from '../../shared/components/loading/loading.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../shared/components/error-state/error-state.component';
import { PagerComponent } from '../../shared/components/pager/pager.component';
import { STATUS_LABELS } from '../../shared/utils/labels';
import { formatBudgetRange, formatDateTime } from '../../shared/utils/format';
import { AdminDetailDialogComponent } from '../../shared/components/admin-detail-dialog/admin-detail-dialog.component';
import { PageLoaderComponent } from '../../shared/components/page-loader/page-loader.component';

const ALL_STATUSES = Object.values(ServiceRequestStatus);
const PAGE_SIZE = 20;

@Component({
  selector: 'app-admin-service-requests',
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
    <p class="tab-description">Todas las solicitudes de servicio enviadas por clientes, con su estado y el matching generado.</p>

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
      <app-error-state message="No pudimos cargar las solicitudes. Intenta recargar la página."></app-error-state>
    } @else if (requests().length === 0) {
      <app-empty-state icon="assignment" message="No hay solicitudes con este filtro."></app-empty-state>
    } @else {
      <div class="table-scroll">
      <table class="data-table">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Servicio</th>
            <th>Comuna</th>
            <th>Contacto</th>
            <th>Estado</th>
            <th>Cambiar estado</th>
          </tr>
        </thead>
        <tbody>
          @for (req of requests(); track req.id) {
            <tr class="clickable-row" (click)="openDetail(req)">
              <td>{{ req.createdAt | date: 'dd/MM/yyyy' }}</td>
              <td>{{ req.service?.name }}</td>
              <td>{{ req.commune?.name }}</td>
              <td>
                {{ req.contactName }}<br />
                <small>{{ req.contactEmail }} · {{ req.contactPhone }}</small>
              </td>
              <td><app-status-badge [status]="req.status"></app-status-badge></td>
              <td (click)="$event.stopPropagation()">
                <select
                  class="status-select"
                  [attr.aria-label]="'Cambiar estado de la solicitud de ' + req.contactName"
                  [value]="req.status"
                  (change)="changeStatus(req, $any($event.target).value)"
                >
                  @for (s of statuses; track s) {
                    <option [value]="s">{{ statusLabels[s] ?? s }}</option>
                  }
                </select>
              </td>
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
        min-width: 640px;
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
        vertical-align: top;
        font-size: 0.9rem;
      }
      .status-select {
        font-family: inherit;
        font-size: 0.82rem;
        font-weight: 600;
        color: var(--eslm-ink);
        padding: 0.35rem 1.8rem 0.35rem 0.8rem;
        border: 1px solid #ddd;
        border-radius: 999px;
        background: #fff url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%23757575'/%3E%3C/svg%3E") no-repeat right 0.8rem center;
        appearance: none;
        cursor: pointer;
        max-width: 160px;
      }
      .status-select:hover {
        border-color: var(--eslm-primary);
      }
      .status-select:focus-visible {
        outline: 2px solid var(--eslm-primary);
        outline-offset: 1px;
      }
    `,
  ],
})
export class AdminServiceRequestsComponent implements OnInit {
  private readonly dialog = inject(MatDialog);

  readonly PAGE_SIZE = PAGE_SIZE;
  readonly statuses = ALL_STATUSES;
  readonly statusLabels = STATUS_LABELS;
  readonly requests = signal<ServiceRequest[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly loading = signal(true);
  readonly hasError = signal(false);
  readonly loadingDetailId = signal<string | null>(null);
  statusFilter: ServiceRequestStatus | undefined;

  constructor(private readonly serviceRequestsService: ServiceRequestsService) {}

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
    this.serviceRequestsService
      .getAllForAdmin({ status: this.statusFilter, page: this.page(), limit: PAGE_SIZE })
      .subscribe({
        next: (result) => {
          this.requests.set(result.data);
          this.total.set(result.total);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.hasError.set(true);
        },
      });
  }

  changeStatus(request: ServiceRequest, status: ServiceRequestStatus): void {
    this.serviceRequestsService.updateStatus(request.id, status).subscribe({
      next: (updated) => {
        this.requests.set(this.requests().map((r) => (r.id === request.id ? { ...r, status: updated.status } : r)));
      },
    });
  }

  openDetail(row: ServiceRequest): void {
    if (this.loadingDetailId()) return;
    this.loadingDetailId.set(row.id);
    this.serviceRequestsService.getByIdForAdmin(row.id).subscribe({
      next: (req) => {
      this.loadingDetailId.set(null);
      this.dialog.open(AdminDetailDialogComponent, {
        width: '560px',
        maxWidth: '95vw',
        autoFocus: false,
        data: {
          title: req.contactName,
          subtitle: req.service?.name,
          status: req.status,
          sections: [
            {
              label: 'Solicitud',
              fields: [
                { label: 'Categoría', value: req.category?.name ?? '' },
                { label: 'Servicio', value: req.service?.name ?? '' },
                { label: 'Comuna', value: req.commune?.name ?? '' },
              ],
            },
            {
              label: 'Detalle',
              fields: [
                { label: 'Descripción', value: req.description },
                { label: 'Dirección', value: req.address ?? '' },
                { label: 'Fecha preferida', value: req.preferredDate ?? '' },
                { label: 'Presupuesto', value: formatBudgetRange(req.budgetMin, req.budgetMax) },
              ],
            },
            {
              label: 'Contacto',
              fields: [
                { label: 'Nombre', value: req.contactName },
                { label: 'Email', value: req.contactEmail },
                { label: 'Teléfono', value: req.contactPhone },
              ],
            },
            {
              label: 'Seguimiento',
              fields: [{ label: 'Creada el', value: formatDateTime(req.createdAt) }],
            },
          ],
        },
        });
      },
      error: () => this.loadingDetailId.set(null),
    });
  }
}
