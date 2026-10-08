import { Component, Inject } from '@angular/core';
import { MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { StatusBadgeComponent } from '../status-badge/status-badge.component';

export interface DetailField {
  label: string;
  value: string;
}

export interface DetailSection {
  /** Rótulo de la sección (ej. "Contacto", "Cobertura"). Sin label, el grupo no muestra encabezado. */
  label?: string;
  fields: DetailField[];
}

export interface AdminDetailDialogData {
  title: string;
  subtitle?: string;
  /** Enum de estado (ServiceRequestStatus/LeadStatus/ProviderStatus/'ACTIVE'|'SUSPENDED') — se muestra como badge, no como campo de texto. */
  status?: string;
  sections: DetailSection[];
}

/**
 * Drill-down genérico para las tablas de admin: recibe secciones ya armadas
 * por el componente que lo abre y las muestra en un shell propio de
 * header/content/footer (no usa mat-dialog-content/-actions) para controlar
 * el scroll en un solo lugar — el contenedor nativo de Material ya impone su
 * propio max-height/overflow, y anidar un segundo scroll adentro producía una
 * barra de scroll visible incluso con poco contenido.
 */
@Component({
  selector: 'app-admin-detail-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, StatusBadgeComponent],
  template: `
    <div class="shell">
      <div class="header">
        <div class="header-text">
          <h2>{{ data.title }}</h2>
          @if (data.subtitle) {
            <p class="subtitle">{{ data.subtitle }}</p>
          }
        </div>
        @if (data.status) {
          <app-status-badge [status]="data.status"></app-status-badge>
        }
      </div>
      <div class="content">
        @for (section of data.sections; track $index) {
          <section class="group">
            @if (section.label) {
              <h3 class="group-label">{{ section.label }}</h3>
            }
            <dl class="fields">
              @for (field of section.fields; track field.label) {
                <div class="field-row">
                  <dt>{{ field.label }}</dt>
                  <dd>{{ field.value || '—' }}</dd>
                </div>
              }
            </dl>
          </section>
        }
      </div>
      <div class="footer">
        <button mat-stroked-button mat-dialog-close cdkFocusInitial>Cerrar</button>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .shell {
        display: flex;
        flex-direction: column;
        max-height: 80vh;
      }
      .header {
        flex: none;
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 1rem;
        padding: 1.5rem 1.75rem 1.1rem;
        border-bottom: 1px solid #eee;
      }
      .header-text h2 {
        margin: 0;
        font-size: 1.2rem;
        font-weight: 700;
        color: var(--eslm-ink, #16213e);
      }
      .subtitle {
        margin: 0.2rem 0 0;
        color: #757575;
        font-size: 0.9rem;
      }
      .content {
        flex: 1 1 auto;
        min-height: 0;
        overflow-y: auto;
        padding: 1.25rem 1.75rem;
      }
      .group {
        margin-bottom: 1.5rem;
      }
      .group:last-child {
        margin-bottom: 0;
      }
      .group-label {
        margin: 0 0 0.6rem;
        font-size: 0.72rem;
        font-weight: 700;
        letter-spacing: 0.07em;
        text-transform: uppercase;
        color: var(--eslm-primary, #0e8388);
      }
      .fields {
        margin: 0;
        background: #fafafa;
        border-radius: 10px;
        padding: 0.25rem 1rem;
      }
      .field-row {
        display: grid;
        grid-template-columns: 150px 1fr;
        gap: 1rem;
        padding: 0.65rem 0;
        border-bottom: 1px solid #ececec;
      }
      .field-row:last-child {
        border-bottom: none;
      }
      dt {
        color: #757575;
        font-size: 0.82rem;
        font-weight: 500;
      }
      dd {
        margin: 0;
        font-size: 0.92rem;
        font-weight: 500;
        color: var(--eslm-ink, #16213e);
        word-break: break-word;
        font-variant-numeric: tabular-nums;
      }
      .footer {
        flex: none;
        display: flex;
        justify-content: flex-end;
        padding: 1rem 1.75rem;
        border-top: 1px solid #eee;
      }

      @media (max-width: 480px) {
        .field-row {
          grid-template-columns: 1fr;
          gap: 0.15rem;
          padding: 0.5rem 0;
        }
        dt {
          font-size: 0.75rem;
        }
      }
    `,
  ],
})
export class AdminDetailDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: AdminDetailDialogData) {}
}
