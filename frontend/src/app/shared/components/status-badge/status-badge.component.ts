import { Component, Input, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { STATUS_LABELS } from '../../utils/labels';

const COLORS: Record<string, string> = {
  DRAFT: '#9e9e9e',
  SUBMITTED: '#2196f3',
  MATCHING: '#2196f3',
  MATCHED: '#1f6f5c',
  IN_PROGRESS: '#ff9d42',
  COMPLETED: '#1f6f5c',
  CANCELLED: '#c62828',
  EXPIRED: '#757575',
  GENERATED: '#9e9e9e',
  DELIVERED: '#2196f3',
  VIEWED: '#7c4dff',
  ACCEPTED: '#1f6f5c',
  REJECTED: '#c62828',
  CONTACTED: '#ff9d42',
  CONVERTED: '#1f6f5c',
  PENDING: '#ff9d42',
  ACTIVE: '#1f6f5c',
  SUSPENDED: '#c62828',
};

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span
      class="badge"
      [style.background]="color() + '1a'"
      [style.color]="color()"
      [style.border]="'1px solid ' + color()"
    >
      {{ label() }}
    </span>
  `,
  styles: [
    `
      .badge {
        display: inline-block;
        padding: 2px 10px;
        border-radius: 999px;
        font-size: 0.78rem;
        font-weight: 600;
        white-space: nowrap;
      }
    `,
  ],
})
export class StatusBadgeComponent {
  private readonly statusSignal = signal<string>('');

  @Input() set status(value: string) {
    this.statusSignal.set(value);
  }

  readonly label = computed(() => STATUS_LABELS[this.statusSignal()] ?? this.statusSignal());
  readonly color = computed(() => COLORS[this.statusSignal()] ?? '#9e9e9e');
}
