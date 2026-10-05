import { Component } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-loading',
  standalone: true,
  imports: [MatProgressSpinnerModule],
  template: `
    <div class="wrap">
      <mat-spinner diameter="36"></mat-spinner>
    </div>
  `,
  styles: [
    `
      .wrap {
        display: flex;
        justify-content: center;
        padding: 2.5rem 0;
      }
    `,
  ],
})
export class LoadingComponent {}
