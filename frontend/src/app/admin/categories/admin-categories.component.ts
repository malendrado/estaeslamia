import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CatalogService } from '../../core/services/catalog.service';
import { Category, Service } from '../../core/models/models';
import { LoadingComponent } from '../../shared/components/loading/loading.component';

@Component({
  selector: 'app-admin-categories',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    LoadingComponent,
  ],
  template: `
    @if (loading()) {
      <app-loading></app-loading>
    } @else {
      <div class="section">
        <h3>Categorías</h3>
        <form [formGroup]="categoryForm" (ngSubmit)="createCategory()" class="inline-form">
          <mat-form-field appearance="outline">
            <mat-label>Nueva categoría</mat-label>
            <input matInput formControlName="name" />
          </mat-form-field>
          <button mat-flat-button color="primary" type="submit" [disabled]="categoryForm.invalid">Agregar</button>
        </form>

        <table class="data-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Slug</th>
              <th>Activa</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            @for (cat of categories(); track cat.id) {
              <tr>
                <td>
                  @if (editingCategoryId() === cat.id) {
                    <input class="inline-input" [(ngModel)]="editingCategoryName" [ngModelOptions]="{ standalone: true }" />
                  } @else {
                    {{ cat.name }}
                  }
                </td>
                <td>{{ cat.slug }}</td>
                <td>{{ cat.isActive ? 'Sí' : 'No' }}</td>
                <td class="actions">
                  @if (editingCategoryId() === cat.id) {
                    <button mat-button color="primary" (click)="saveCategoryEdit(cat)">Guardar</button>
                    <button mat-button (click)="editingCategoryId.set(null)">Cancelar</button>
                  } @else {
                    <button mat-icon-button (click)="startEditCategory(cat)"><mat-icon>edit</mat-icon></button>
                    @if (cat.isActive) {
                      <button mat-icon-button (click)="deactivateCategory(cat)"><mat-icon>visibility_off</mat-icon></button>
                    }
                  }
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <div class="section">
        <h3>Servicios</h3>
        <form [formGroup]="serviceForm" (ngSubmit)="createService()" class="inline-form">
          <mat-form-field appearance="outline">
            <mat-label>Nuevo servicio</mat-label>
            <input matInput formControlName="name" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Categoría</mat-label>
            <mat-select formControlName="categoryId">
              @for (cat of categories(); track cat.id) {
                <mat-option [value]="cat.id">{{ cat.name }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
          <button mat-flat-button color="primary" type="submit" [disabled]="serviceForm.invalid">Agregar</button>
        </form>

        <table class="data-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Categoría</th>
              <th>Activo</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            @for (svc of services(); track svc.id) {
              <tr>
                <td>{{ svc.name }}</td>
                <td>{{ categoryName(svc.categoryId) }}</td>
                <td>{{ svc.isActive ? 'Sí' : 'No' }}</td>
                <td class="actions">
                  @if (svc.isActive) {
                    <button mat-icon-button (click)="deactivateService(svc)"><mat-icon>visibility_off</mat-icon></button>
                  }
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }
  `,
  styles: [
    `
      .section {
        margin-bottom: 2.5rem;
      }
      .inline-form {
        display: flex;
        gap: 1rem;
        align-items: start;
        margin-bottom: 1rem;
        flex-wrap: wrap;
      }
      .data-table {
        width: 100%;
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
        padding: 0.5rem;
        border-bottom: 1px solid #f2f2f2;
        font-size: 0.9rem;
      }
      .inline-input {
        border: 1px solid #ccc;
        border-radius: 4px;
        padding: 4px 8px;
        font-size: 0.9rem;
      }
      .actions {
        white-space: nowrap;
      }
    `,
  ],
})
export class AdminCategoriesComponent implements OnInit {
  private readonly fb = inject(FormBuilder);

  readonly loading = signal(true);
  readonly categories = signal<Category[]>([]);
  readonly services = signal<Service[]>([]);
  readonly editingCategoryId = signal<string | null>(null);
  editingCategoryName = '';

  readonly categoryForm = this.fb.group({
    name: ['', Validators.required],
  });

  readonly serviceForm = this.fb.group({
    name: ['', Validators.required],
    categoryId: ['', Validators.required],
  });

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

  createCategory(): void {
    if (this.categoryForm.invalid) return;
    const { name } = this.categoryForm.getRawValue();
    this.catalogService.createCategory({ name: name! }).subscribe(() => {
      this.categoryForm.reset();
      this.reload();
    });
  }

  startEditCategory(cat: Category): void {
    this.editingCategoryId.set(cat.id);
    this.editingCategoryName = cat.name;
  }

  saveCategoryEdit(cat: Category): void {
    this.catalogService.updateCategory(cat.id, { name: this.editingCategoryName }).subscribe(() => {
      this.editingCategoryId.set(null);
      this.reload();
    });
  }

  deactivateCategory(cat: Category): void {
    this.catalogService.deactivateCategory(cat.id).subscribe(() => this.reload());
  }

  createService(): void {
    if (this.serviceForm.invalid) return;
    const { name, categoryId } = this.serviceForm.getRawValue();
    this.catalogService.createService({ name: name!, categoryId: categoryId! }).subscribe(() => {
      this.serviceForm.reset();
      this.reload();
    });
  }

  deactivateService(svc: Service): void {
    this.catalogService.deactivateService(svc.id).subscribe(() => this.reload());
  }
}
