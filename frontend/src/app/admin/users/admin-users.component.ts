import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { UsersService } from '../../core/services/users.service';
import { User, UserRole } from '../../core/models/models';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { LoadingComponent } from '../../shared/components/loading/loading.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../shared/components/error-state/error-state.component';
import { PagerComponent } from '../../shared/components/pager/pager.component';
import { ROLE_LABELS } from '../../shared/utils/labels';
import { formatDateTime } from '../../shared/utils/format';
import { AdminDetailDialogComponent } from '../../shared/components/admin-detail-dialog/admin-detail-dialog.component';
import { PageLoaderComponent } from '../../shared/components/page-loader/page-loader.component';

const ALL_ROLES = Object.values(UserRole);
const PAGE_SIZE = 20;

@Component({
  selector: 'app-admin-users',
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
    <p class="tab-description">Cuentas registradas en la plataforma — clientes, empresas y administradores.</p>

    <div class="filters">
      <mat-form-field appearance="outline">
        <mat-label>Rol</mat-label>
        <mat-select [(ngModel)]="roleFilter" (selectionChange)="goToPage(1)">
          <mat-option [value]="undefined">Todos</mat-option>
          @for (r of roles; track r) {
            <mat-option [value]="r">{{ roleLabels[r] }}</mat-option>
          }
        </mat-select>
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Estado</mat-label>
        <mat-select [(ngModel)]="activeFilter" (selectionChange)="goToPage(1)">
          <mat-option [value]="undefined">Todos</mat-option>
          <mat-option [value]="true">Activos</mat-option>
          <mat-option [value]="false">Inactivos / suspendidos</mat-option>
        </mat-select>
      </mat-form-field>
    </div>

    @if (loading()) {
      <app-loading></app-loading>
    } @else if (hasError()) {
      <app-error-state message="No pudimos cargar los usuarios. Intenta recargar la página."></app-error-state>
    } @else if (users().length === 0) {
      <app-empty-state icon="people" message="No hay usuarios con este filtro."></app-empty-state>
    } @else {
      <div class="table-scroll">
        <table class="data-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            @for (user of users(); track user.id) {
              <tr class="clickable-row" (click)="openDetail(user)">
                <td>{{ user.name }}</td>
                <td>{{ user.email }}</td>
                <td>{{ roleLabels[user.role] }}</td>
                <td><app-status-badge [status]="user.isActive ? 'ACTIVE' : 'SUSPENDED'"></app-status-badge></td>
                <td (click)="$event.stopPropagation()">
                  @if (user.isActive) {
                    <button mat-stroked-button color="warn" (click)="toggle(user, false)">Suspender</button>
                  } @else if (user.hasPassword) {
                    <button mat-stroked-button color="primary" (click)="toggle(user, true)">Reactivar</button>
                  } @else {
                    <span class="hint">Cuenta sin registrar</span>
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
        display: flex;
        gap: 1rem;
        margin-bottom: 1rem;
        flex-wrap: wrap;
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
      .hint {
        color: #999;
        font-size: 0.8rem;
      }
    `,
  ],
})
export class AdminUsersComponent implements OnInit {
  private readonly dialog = inject(MatDialog);

  readonly PAGE_SIZE = PAGE_SIZE;
  readonly roles = ALL_ROLES;
  readonly roleLabels = ROLE_LABELS;
  readonly users = signal<User[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly loading = signal(true);
  readonly hasError = signal(false);
  readonly loadingDetailId = signal<string | null>(null);
  roleFilter: UserRole | undefined;
  activeFilter: boolean | undefined;

  constructor(private readonly usersService: UsersService) {}

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
    this.usersService
      .getAllForAdmin({ role: this.roleFilter, isActive: this.activeFilter, page: this.page(), limit: PAGE_SIZE })
      .subscribe({
        next: (result) => {
          this.users.set(result.data);
          this.total.set(result.total);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.hasError.set(true);
        },
      });
  }

  toggle(user: User, isActive: boolean): void {
    this.usersService.setActiveStatus(user.id, isActive).subscribe({
      next: (updated) => {
        this.users.set(this.users().map((u) => (u.id === user.id ? { ...u, isActive: updated.isActive } : u)));
      },
    });
  }

  openDetail(row: User): void {
    if (this.loadingDetailId()) return;
    this.loadingDetailId.set(row.id);
    this.usersService.getByIdForAdmin(row.id).subscribe({
      next: (user) => {
      this.loadingDetailId.set(null);
      this.dialog.open(AdminDetailDialogComponent, {
        width: '560px',
        maxWidth: '95vw',
        autoFocus: false,
        data: {
          title: user.name,
          subtitle: this.roleLabels[user.role],
          status: user.isActive ? 'ACTIVE' : 'SUSPENDED',
          sections: [
            {
              label: 'Cuenta',
              fields: [
                { label: 'Email', value: user.email },
                { label: 'Teléfono', value: user.phone ?? '' },
                { label: 'Tiene contraseña', value: user.hasPassword ? 'Sí' : 'No (cuenta silenciosa)' },
              ],
            },
            {
              label: 'Seguimiento',
              fields: [{ label: 'Registrado el', value: formatDateTime(user.createdAt) }],
            },
          ],
        },
        });
      },
      error: () => this.loadingDetailId.set(null),
    });
  }
}
