import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-pager',
  standalone: true,
  imports: [MatButtonModule, MatIconModule],
  template: `
    @if (total > 0) {
      <div class="pager">
        <span class="range">{{ rangeStart() }}–{{ rangeEnd() }} de {{ total }}</span>
        <div class="controls">
          <button mat-icon-button [disabled]="page <= 1" (click)="pageChange.emit(page - 1)" aria-label="Anterior">
            <mat-icon>chevron_left</mat-icon>
          </button>
          <button mat-icon-button [disabled]="rangeEnd() >= total" (click)="pageChange.emit(page + 1)" aria-label="Siguiente">
            <mat-icon>chevron_right</mat-icon>
          </button>
        </div>
      </div>
    }
  `,
  styles: [
    `
      .pager {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-top: 1rem;
        font-size: 0.85rem;
        color: #757575;
      }
      .controls {
        display: flex;
        align-items: center;
      }
    `,
  ],
})
export class PagerComponent {
  @Input() page = 1;
  @Input() total = 0;
  @Input() limit = 20;
  @Output() pageChange = new EventEmitter<number>();

  rangeStart(): number {
    return this.total === 0 ? 0 : (this.page - 1) * this.limit + 1;
  }

  rangeEnd(): number {
    return Math.min(this.page * this.limit, this.total);
  }
}
