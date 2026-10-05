import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ServiceRequestsService } from '../../core/services/service-requests.service';
import { ServiceRequest, ServiceRequestStatus } from '../../core/models/models';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { LoadingComponent } from '../../shared/components/loading/loading.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { PagerComponent } from '../../shared/components/pager/pager.component';

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
    PagerComponent,
  ],
  template: `
    <div class="filters">
      <mat-form-field appearance="outline">
        <mat-label>Filtrar por estado</mat-label>
        <mat-select [(ngModel)]="statusFilter" (selectionChange)="goToPage(1)">
          <mat-option [value]="undefined">Todos</mat-option>
          @for (s of statuses; track s) {
            <mat-option [value]="s">{{ s }}</mat-option>
          }
        </mat-select>
      </mat-form-field>
    </div>

    @if (loading()) {
      <app-loading></app-loading>
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
            <tr>
              <td>{{ req.createdAt | date: 'dd/MM/yyyy' }}</td>
              <td>{{ req.service?.name }}</td>
              <td>{{ req.commune?.name }}</td>
              <td>
                {{ req.contactName }}<br />
                <small>{{ req.contactEmail }} · {{ req.contactPhone }}</small>
              </td>
              <td><app-status-badge [status]="req.status"></app-status-badge></td>
              <td>
                <mat-form-field appearance="outline" class="compact">
                  <mat-select [value]="req.status" (selectionChange)="changeStatus(req, $event.value)">
                    @for (s of statuses; track s) {
                      <mat-option [value]="s">{{ s }}</mat-option>
                    }
                  </mat-select>
                </mat-form-field>
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
      .compact {
        width: 160px;
      }
      ::ng-deep .compact .mat-mdc-text-field-wrapper {
        height: 40px;
      }
    `,
  ],
})
export class AdminServiceRequestsComponent implements OnInit {
  readonly PAGE_SIZE = PAGE_SIZE;
  readonly statuses = ALL_STATUSES;
  readonly requests = signal<ServiceRequest[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly loading = signal(true);
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
    this.serviceRequestsService
      .getAllForAdmin({ status: this.statusFilter, page: this.page(), limit: PAGE_SIZE })
      .subscribe({
        next: (result) => {
          this.requests.set(result.data);
          this.total.set(result.total);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  changeStatus(request: ServiceRequest, status: ServiceRequestStatus): void {
    this.serviceRequestsService.updateStatus(request.id, status).subscribe({
      next: (updated) => {
        this.requests.set(this.requests().map((r) => (r.id === request.id ? { ...r, status: updated.status } : r)));
      },
    });
  }
}
