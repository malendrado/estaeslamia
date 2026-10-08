import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { ProvidersService } from '../../core/services/providers.service';
import { Provider, ProviderStatus } from '../../core/models/models';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { LoadingComponent } from '../../shared/components/loading/loading.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../shared/components/error-state/error-state.component';
import { PagerComponent } from '../../shared/components/pager/pager.component';
import { STATUS_LABELS } from '../../shared/utils/labels';
import { formatDateTime } from '../../shared/utils/format';
import { AdminDetailDialogComponent } from '../../shared/components/admin-detail-dialog/admin-detail-dialog.component';
import { PageLoaderComponent } from '../../shared/components/page-loader/page-loader.component';

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
    ErrorStateComponent,
    PagerComponent,
    PageLoaderComponent,
  ],
  template: `
    <app-page-loader [visible]="!!loadingDetailId()"></app-page-loader>
    <p class="tab-description">Empresas registradas en la plataforma — aprueba, rechaza o suspende según corresponda.</p>

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
      <app-error-state message="No pudimos cargar las empresas. Intenta recargar la página."></app-error-state>
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
            <tr class="clickable-row" (click)="openDetail(provider)">
              <td>{{ provider.businessName }}</td>
              <td>
                {{ provider.email }}<br />
                <small>{{ provider.phone }}</small>
              </td>
              <td><app-status-badge [status]="provider.status"></app-status-badge></td>
              <td class="actions" (click)="$event.stopPropagation()">
                @if (provider.status === ProviderStatus.PENDING) {
                  <button mat-stroked-button color="primary" (click)="setStatus(provider, ProviderStatus.ACTIVE)">Aprobar</button>
                  <button mat-stroked-button color="warn" (click)="setStatus(provider, ProviderStatus.REJECTED)">Rechazar</button>
                }
                @if (provider.status === ProviderStatus.ACTIVE) {
                  <button mat-stroked-button color="warn" (click)="setStatus(provider, ProviderStatus.SUSPENDED)">Suspender</button>
                }
                @if (provider.status === ProviderStatus.SUSPENDED) {
                  <button mat-stroked-button color="primary" (click)="setStatus(provider, ProviderStatus.ACTIVE)">Reactivar</button>
                }
                @if (provider.status === ProviderStatus.REJECTED) {
                  <button mat-stroked-button color="primary" (click)="setStatus(provider, ProviderStatus.PENDING)">Reconsiderar</button>
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
        display: flex;
        gap: 0.5rem;
      }
    `,
  ],
})
export class AdminProvidersComponent implements OnInit {
  private readonly dialog = inject(MatDialog);

  readonly ProviderStatus = ProviderStatus;
  readonly PAGE_SIZE = PAGE_SIZE;
  readonly statuses = ALL_STATUSES;
  readonly statusLabels = STATUS_LABELS;
  readonly providers = signal<Provider[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly loading = signal(true);
  readonly hasError = signal(false);
  readonly loadingDetailId = signal<string | null>(null);
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
    this.hasError.set(false);
    this.providersService.getAllForAdmin(this.statusFilter, this.page(), PAGE_SIZE).subscribe({
      next: (result) => {
        this.providers.set(result.data);
        this.total.set(result.total);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.hasError.set(true);
      },
    });
  }

  setStatus(provider: Provider, status: ProviderStatus): void {
    this.providersService.updateStatus(provider.id, status).subscribe({
      next: (updated) => {
        this.providers.set(this.providers().map((p) => (p.id === provider.id ? { ...p, status: updated.status } : p)));
      },
    });
  }

  openDetail(row: Provider): void {
    if (this.loadingDetailId()) return;
    this.loadingDetailId.set(row.id);
    this.providersService.getByIdForAdmin(row.id).subscribe({
      next: (provider) => {
      this.loadingDetailId.set(null);
      const services = (provider.providerServices ?? []).map((ps) => ps.service?.name).filter(Boolean).join(', ');
      const communes = (provider.providerCommunes ?? []).map((pc) => pc.commune?.name).filter(Boolean).join(', ');
      this.dialog.open(AdminDetailDialogComponent, {
        width: '560px',
        maxWidth: '95vw',
        autoFocus: false,
        data: {
          title: provider.businessName,
          subtitle: provider.legalName ?? provider.rut ?? undefined,
          status: provider.status,
          sections: [
            {
              label: 'Empresa',
              fields: [
                { label: 'Nombre legal', value: provider.legalName ?? '' },
                { label: 'RUT', value: provider.rut ?? '' },
                { label: 'Descripción', value: provider.description ?? '' },
              ],
            },
            {
              label: 'Contacto',
              fields: [
                { label: 'Email', value: provider.email },
                { label: 'Teléfono', value: provider.phone },
                { label: 'WhatsApp', value: provider.whatsapp ?? '' },
                { label: 'Sitio web', value: provider.website ?? '' },
              ],
            },
            {
              label: 'Cobertura',
              fields: [
                { label: 'Servicios', value: services },
                { label: 'Comunas', value: communes },
              ],
            },
            {
              label: 'Seguimiento',
              fields: [{ label: 'Registrada el', value: formatDateTime(provider.createdAt) }],
            },
          ],
        },
        });
      },
      error: () => this.loadingDetailId.set(null),
    });
  }
}
