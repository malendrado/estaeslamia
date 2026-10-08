import { Component, Input } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

/**
 * Overlay de carga a pantalla completa (position: fixed, cubre toda la
 * ventana sin importar dónde viva este componente en el árbol). Para esperas
 * cortas donde el spinner inline de una fila/botón pasa desapercibido.
 */
@Component({
  selector: 'app-page-loader',
  standalone: true,
  imports: [MatProgressSpinnerModule],
  template: `
    @if (visible) {
      <div class="overlay">
        <mat-spinner diameter="48"></mat-spinner>
      </div>
    }
  `,
  styles: [
    `
      .overlay {
        position: fixed;
        inset: 0;
        background: rgba(255, 255, 255, 0.65);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 2000;
      }
    `,
  ],
})
export class PageLoaderComponent {
  @Input() visible = false;
}
