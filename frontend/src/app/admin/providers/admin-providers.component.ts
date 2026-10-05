import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { ProvidersService } from '../../core/services/providers.service';
import { Provider, ProviderStatus } from '../../core/models/models';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { LoadingComponent } from '../../shared/components/loading/loading.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { PagerComponent } from '../../shared/components/pager/pager.component';

const ALL_STATUSES = Object.values(ProviderStatus);
const PAGE_SIZE = 20;

@Component({
  selector: 'app-admin-providers',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatSelectModule,
    MatFormFieldModule,
    MatButtonModule,
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
    } @else if (providers().length === 0) {
      <app-empty-state icon="storefront" message="No hay empresas con este filtro."></app-empty-state>
    } @else {
      <div class="table-scroll">
      <table class="data-table">
        <thead>
          <tr>
            <th>Empresa</th>
            <th>Contacto</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          @for (provider of providers(); track provider.id) {
            <tr>
              <td>{{ provider.businessName }}</td>
              <td>
                {{ provider.email }}<br />
                <small>{{ provider.phone }}</small>
              </td>
              <td><app-status-badge [status]="provider.status"></app-status-badge></td>
              <td class="actions">
                @if (provider.status === ProviderStatus.PENDING) {
                  <button mat-button color="primary" (click)="setStatus(provider, ProviderStatus.ACTIVE)">Aprobar</button>
                  <button mat-button color="warn" (click)="setStatus(provider, ProviderStatus.REJECTED)">Rechazar</button>
                }
                @if (provider.status === ProviderStatus.ACTIVE) {
                  <button mat-button color="warn" (click)="setStatus(provider, ProviderStatus.SUSPENDED)">Suspender</button>
                }
                @if (provider.status === ProviderStatus.SUSPENDED) {
                  <button mat-button color="primary" (click)="setStatus(provider, ProviderStatus.ACTIVE)">Reactivar</button>
                }
                @if (provider.status === ProviderStatus.REJECTED) {
                  <button mat-button color="primary" (click)="setStatus(provider, ProviderStatus.PENDING)">Reconsiderar</button>
                }
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
        min-width: 520px;
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
      .actions {
        white-space: nowrap;
      }
    `,
  ],
})
export class AdminProvidersComponent implements OnInit {
  readonly ProviderStatus = ProviderStatus;
  readonly PAGE_SIZE = PAGE_SIZE;
  readonly statuses = ALL_STATUSES;
  readonly providers = signal<Provider[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly loading = signal(true);
  statusFilter: ProviderStatus | undefined;

  constructor(private readonly providersService: ProvidersService) {}

  ngOnInit(): void {
    this.reload();
  }

  goToPage(page: number): void {
    this.page.set(page);
    this.reload();
  }

  reload(): void {
    this.loading.set(true);
    this.providersService.getAllForAdmin(this.statusFilter, this.page(), PAGE_SIZE).subscribe({
      next: (result) => {
        this.providers.set(result.data);
        this.total.set(result.total);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  setStatus(provider: Provider, status: ProviderStatus): void {
    this.providersService.updateStatus(provider.id, status).subscribe({
      next: (updated) => {
        this.providers.set(this.providers().map((p) => (p.id === provider.id ? { ...p, status: updated.status } : p)));
      },
    });
  }
}
