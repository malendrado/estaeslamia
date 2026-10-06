import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { CatalogService } from '../../core/services/catalog.service';
import { Category, Service } from '../../core/models/models';
import { LoadingComponent } from '../../shared/components/loading/loading.component';
import { CatalogItemDialogComponent, CatalogItemDialogData, CatalogItemDialogResult } from './catalog-item-dialog.component';

@Component({
  selector: 'app-admin-categories',
  standalone: true,
  imports: [CommonModule, MatButtonModule, LoadingComponent],
  template: `
    @if (loading()) {
      <app-loading></app-loading>
    } @else {
      <div class="section">
        <div class="section-header">
          <h3>Categorías</h3>
          <button mat-flat-button color="primary" (click)="openCategoryDialog()">Nueva categoría</button>
        </div>

        <div class="table-scroll">
          <table class="data-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Slug</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (cat of categories(); track cat.id) {
                <tr>
                  <td>{{ cat.name }}</td>
                  <td class="muted">{{ cat.slug }}</td>
                  <td><span class="pill" [class.pill-off]="!cat.isActive">{{ cat.isActive ? 'Activa' : 'Inactiva' }}</span></td>
                  <td class="actions">
                    <button mat-stroked-button class="action-btn" (click)="openCategoryDialog(cat)">Editar</button>
                    @if (cat.isActive) {
                      <button mat-stroked-button color="warn" class="action-btn" (click)="deactivateCategory(cat)">Desactivar</button>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <div class="section">
        <div class="section-header">
          <h3>Servicios</h3>
          <button mat-flat-button color="primary" (click)="openServiceDialog()">Nuevo servicio</button>
        </div>

        <div class="table-scroll">
          <table class="data-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Categoría</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (svc of services(); track svc.id) {
                <tr>
                  <td>{{ svc.name }}</td>
                  <td class="muted">{{ categoryName(svc.categoryId) }}</td>
                  <td><span class="pill" [class.pill-off]="!svc.isActive">{{ svc.isActive ? 'Activo' : 'Inactivo' }}</span></td>
                  <td class="actions">
                    <button mat-stroked-button class="action-btn" (click)="openServiceDialog(svc)">Editar</button>
                    @if (svc.isActive) {
                      <button mat-stroked-button color="warn" class="action-btn" (click)="deactivateService(svc)">Desactivar</button>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    }
  `,
  styles: [
    `
      .section {
        margin-bottom: 2.5rem;
      }
      .section:last-child {
        margin-bottom: 0;
      }
      .section-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 1rem;
      }
      .section-header h3 {
        margin: 0;
      }
      .table-scroll {
        overflow-x: auto;
        border: 1px solid #eee;
        border-radius: 12px;
      }
      .data-table {
        width: 100%;
        table-layout: fixed;
        border-collapse: collapse;
      }
      .data-table tbody tr {
        transition: background 0.1s ease;
      }
      .data-table tbody tr:hover {
        background: #fafaf8;
      }
      .data-table tr:last-child td {
        border-bottom: none;
      }
      /* table-layout:fixed + anchos compartidos por .data-table: así "Nombre"
         y "Estado" quedan alineados entre la tabla de Categorías (5 columnas)
         y la de Servicios (4 columnas), que tienen distinto número de
         columnas pero deben verse alineadas verticalmente. */
      .data-table th:nth-child(1),
      .data-table td:nth-child(1) {
        width: 38%;
      }
      .data-table th:nth-child(2),
      .data-table td:nth-child(2) {
        width: 22%;
      }
      .data-table th:nth-child(3),
      .data-table td:nth-child(3) {
        width: 14%;
      }
      .data-table th {
        text-align: left;
        font-size: 0.78rem;
        color: #757575;
        border-bottom: 1px solid #eee;
        padding: 0.4rem 0.5rem;
      }
      .data-table td {
        padding: 0.45rem 0.5rem;
        border-bottom: 1px solid #f2f2f2;
        font-size: 0.88rem;
      }
      /* Ellipsis solo en las columnas de texto (nombre/slug/categoría), nunca
         en la de acciones — ahí cortaría los botones con table-layout:fixed. */
      .data-table td:nth-child(1),
      .data-table td:nth-child(2) {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .muted {
        color: #757575;
      }
      .pill {
        display: inline-block;
        padding: 0.15rem 0.7rem;
        border-radius: 999px;
        font-size: 0.78rem;
        font-weight: 600;
        background: rgba(14, 131, 136, 0.1);
        color: var(--eslm-primary-dark);
      }
      .pill-off {
        background: #f2f2f2;
        color: #757575;
      }
      .actions {
        white-space: nowrap;
        display: flex;
        gap: 0.5rem;
      }
      .action-btn {
        font-size: 0.78rem;
        line-height: 32px;
      }
    `,
  ],
})
export class AdminCategoriesComponent implements OnInit {
  private readonly dialog = inject(MatDialog);

  readonly loading = signal(true);
  readonly categories = signal<Category[]>([]);
  readonly services = signal<Service[]>([]);

  constructor(private readonly catalogService: CatalogService) {}

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.loading.set(true);
    this.catalogService.getCategoriesForAdmin().subscribe((categories) => {
      this.categories.set(categories);
      this.catalogService.getServicesForAdmin().subscribe((services) => {
        this.services.set(services);
        this.loading.set(false);
      });
    });
  }

  categoryName(categoryId: string): string {
    return this.categories().find((c) => c.id === categoryId)?.name ?? '—';
  }

  openCategoryDialog(cat?: Category): void {
    this.dialog
      .open<CatalogItemDialogComponent, CatalogItemDialogData, CatalogItemDialogResult>(CatalogItemDialogComponent, {
        data: { kind: 'category', item: cat },
      })
      .afterClosed()
      .subscribe((result) => {
        if (!result) return;
        const request = cat
          ? this.catalogService.updateCategory(cat.id, { name: result.name })
          : this.catalogService.createCategory({ name: result.name });
        request.subscribe(() => this.reload());
      });
  }

  deactivateCategory(cat: Category): void {
    this.catalogService.deactivateCategory(cat.id).subscribe(() => this.reload());
  }

  openServiceDialog(svc?: Service): void {
    this.dialog
      .open<CatalogItemDialogComponent, CatalogItemDialogData, CatalogItemDialogResult>(CatalogItemDialogComponent, {
        data: { kind: 'service', item: svc, categories: this.categories() },
      })
      .afterClosed()
      .subscribe((result) => {
        if (!result) return;
        const request = svc
          ? this.catalogService.updateService(svc.id, { name: result.name, categoryId: result.categoryId })
          : this.catalogService.createService({ name: result.name, categoryId: result.categoryId! });
        request.subscribe(() => this.reload());
      });
  }

  deactivateService(svc: Service): void {
    this.catalogService.deactivateService(svc.id).subscribe(() => this.reload());
  }
}
