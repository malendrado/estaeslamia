import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [MatIconModule],
  template: `
    <div class="wrap">
      <div class="icon-badge">
        <mat-icon>{{ icon }}</mat-icon>
      </div>
      <p>{{ message }}</p>
      <div class="actions">
        <ng-content></ng-content>
      </div>
    </div>
  `,
  styles: [
    `
      .wrap {
        text-align: center;
        padding: 3rem 1.5rem;
        color: #757575;
        background: #fafafa;
        border: 1px dashed #ddd;
        border-radius: 16px;
      }
      .icon-badge {
        width: 56px;
        height: 56px;
        margin: 0 auto 1rem;
        border-radius: 50%;
        background: #eee;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      mat-icon {
        font-size: 1.75rem;
        width: 1.75rem;
        height: 1.75rem;
        color: #9e9e9e;
      }
      p {
        margin: 0;
      }
      .actions:not(:empty) {
        margin-top: 1.25rem;
      }
    `,
  ],
})
export class EmptyStateComponent {
  @Input() icon = 'inbox';
  @Input() message = 'No hay nada que mostrar todavía.';
}
