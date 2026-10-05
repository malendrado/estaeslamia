import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-provider-layout',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <div class="provider-shell">
      <h1>Panel de empresa</h1>
      <nav class="tabs">
        <a routerLink="/proveedor" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">Mis leads</a>
        <a routerLink="/proveedor/perfil" routerLinkActive="active">Mi perfil</a>
      </nav>
      <div class="tab-content">
        <router-outlet></router-outlet>
      </div>
    </div>
  `,
  styles: [
    `
      .provider-shell {
        max-width: 960px;
        margin: 0 auto;
        padding: 2rem 1rem 4rem;
      }
      .tabs {
        display: flex;
        gap: 1.5rem;
        border-bottom: 1px solid #eee;
        margin-bottom: 1.5rem;
      }
      .tabs a {
        padding-bottom: 0.75rem;
        color: #757575;
        text-decoration: none;
        font-weight: 600;
      }
      .tabs a.active {
        color: var(--eslm-primary);
        border-bottom: 2px solid var(--eslm-primary);
      }
    `,
  ],
})
export class ProviderLayoutComponent {}
