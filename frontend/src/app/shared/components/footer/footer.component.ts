import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink],
  template: `
    <footer class="footer">
      <span>© {{ year }} EstaEsLaMía.cl — Conectando personas con quienes pueden ayudarlas.</span>
      <nav class="legal-links">
        <a routerLink="/terminos">Términos y Condiciones</a>
        <span aria-hidden="true">·</span>
        <a routerLink="/privacidad">Política de Privacidad</a>
      </nav>
      <span class="credit">
        Powered by
        <a href="https://cortesdev.cl" target="_blank" rel="noopener">cortesdev.cl</a>
      </span>
    </footer>
  `,
  styles: [
    `
      .footer {
        padding: 1.5rem;
        text-align: center;
        font-size: 0.8rem;
        color: #999;
        border-top: 1px solid #eee;
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
      }
      .credit a {
        color: var(--eslm-primary);
        font-weight: 600;
        text-decoration: none;
      }
      .credit a:hover {
        text-decoration: underline;
      }
      .legal-links {
        display: flex;
        justify-content: center;
        gap: 0.5rem;
      }
      .legal-links a {
        color: #999;
        text-decoration: none;
      }
      .legal-links a:hover {
        text-decoration: underline;
      }
    `,
  ],
})
export class FooterComponent {
  readonly year = new Date().getFullYear();
}
