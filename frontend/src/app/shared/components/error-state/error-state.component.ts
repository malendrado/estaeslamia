import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-error-state',
  standalone: true,
  imports: [MatIconModule],
  template: `
    <div class="wrap" role="alert">
      <mat-icon>{{ icon }}</mat-icon>
      <p>{{ message }}</p>
      <ng-content></ng-content>
    </div>
  `,
  styles: [
    `
      .wrap {
        text-align: center;
        padding: 3rem 1rem;
        color: #c62828;
      }
      mat-icon {
        font-size: 2.5rem;
        width: 2.5rem;
        height: 2.5rem;
      }
    `,
  ],
})
export class ErrorStateComponent {
  @Input() icon = 'error_outline';
  @Input() message = 'No pudimos cargar la información. Intenta recargar la página.';
}
