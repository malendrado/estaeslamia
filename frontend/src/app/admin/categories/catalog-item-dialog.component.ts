import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { Category } from '../../core/models/models';

export interface CatalogItemDialogData {
  kind: 'category' | 'service';
  item?: { name: string; categoryId?: string };
  categories?: Category[];
}

export interface CatalogItemDialogResult {
  name: string;
  categoryId?: string;
}

@Component({
  selector: 'app-catalog-item-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ title }}</h2>
    <form [formGroup]="form" (ngSubmit)="save()">
      <div mat-dialog-content>
        <mat-form-field appearance="outline" class="full">
          <mat-label>Nombre</mat-label>
          <input matInput formControlName="name" cdkFocusInitial />
        </mat-form-field>

        @if (data.kind === 'service') {
          <mat-form-field appearance="outline" class="full">
            <mat-label>Categoría</mat-label>
            <mat-select formControlName="categoryId">
              @for (cat of data.categories; track cat.id) {
                <mat-option [value]="cat.id">{{ cat.name }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        }
      </div>
      <div mat-dialog-actions align="end">
        <button mat-stroked-button type="button" mat-dialog-close>Cancelar</button>
        <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid">Guardar</button>
      </div>
    </form>
  `,
  styles: [
    `
      .full {
        width: 100%;
        min-width: 320px;
      }
    `,
  ],
})
export class CatalogItemDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<CatalogItemDialogComponent, CatalogItemDialogResult>);
  readonly data: CatalogItemDialogData = inject(MAT_DIALOG_DATA);

  readonly isEdit = !!this.data.item;
  readonly title = `${this.isEdit ? 'Editar' : 'Nueva'} ${this.data.kind === 'category' ? 'categoría' : 'servicio'}`;

  readonly form = this.fb.group({
    name: [this.data.item?.name ?? '', Validators.required],
    categoryId: [this.data.item?.categoryId ?? '', this.data.kind === 'service' ? Validators.required : []],
  });

  save(): void {
    if (this.form.invalid) return;
    const { name, categoryId } = this.form.getRawValue();
    this.dialogRef.close({ name: name!, categoryId: categoryId || undefined });
  }
}
