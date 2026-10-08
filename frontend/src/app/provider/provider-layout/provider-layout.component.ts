import { Component, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { filter } from 'rxjs';

@Component({
  selector: 'app-provider-layout',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet, MatIconModule],
  template: `
    <div class="provider-shell">
      <h1>Panel de empresa</h1>
      <nav class="tabs">
        <a routerLink="/proveedor" [class.active]="leadsTabActive()">Mis leads</a>
        <a routerLink="/proveedor/perfil" routerLinkActive="active">Mi perfil</a>
      </nav>
      @if (isLeadDetailRoute()) {
        <a routerLink="/proveedor" class="back-link"><mat-icon inline>arrow_back</mat-icon> Volver a mis leads</a>
      }
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
        padding: 2.5rem 1.5rem 4rem;
      }
      h1 {
        margin-bottom: 1.5rem;
      }
      .tabs {
        display: flex;
        gap: 0.25rem;
        border-bottom: 1px solid #eee;
        margin-bottom: 1.75rem;
        flex-wrap: wrap;
        overflow-x: auto;
      }
      .tabs a {
        padding: 0.65rem 1rem;
        color: #757575;
        text-decoration: none;
        font-weight: 600;
        font-size: 0.92rem;
        border-radius: 10px 10px 0 0;
        border-bottom: 2px solid transparent;
        transition: background 0.15s ease, color 0.15s ease;
        white-space: nowrap;
      }
      .tabs a:hover {
        background: rgba(14, 131, 136, 0.06);
        color: var(--eslm-ink);
      }
      .tabs a.active {
        color: var(--eslm-primary);
        background: rgba(14, 131, 136, 0.08);
        border-bottom-color: var(--eslm-primary);
      }
      .back-link {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        margin-bottom: 1rem;
        color: #757575;
        text-decoration: none;
        font-size: 0.9rem;
      }
      .tab-content {
        background: #fff;
        border: 1px solid #eee;
        border-radius: 16px;
        box-shadow: 0 16px 32px -20px rgba(22, 33, 62, 0.15);
        padding: 1.75rem;
      }
    `,
  ],
})
export class ProviderLayoutComponent {
  private readonly router = inject(Router);

  // "Mis leads" vive en la raíz /proveedor pero tiene hijos (/proveedor/leads/:id)
  // que no son /proveedor/perfil — routerLinkActive con exact:true no los cubre,
  // y sin exact también activaría el tab en /perfil. Se resuelve a mano.
  readonly leadsTabActive = signal(this.isLeadsRoute(this.router.url));
  readonly isLeadDetailRoute = signal(this.isLeadDetailUrl(this.router.url));

  constructor() {
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe((e) => {
      const url = (e as NavigationEnd).urlAfterRedirects;
      this.leadsTabActive.set(this.isLeadsRoute(url));
      this.isLeadDetailRoute.set(this.isLeadDetailUrl(url));
    });
  }

  private isLeadsRoute(url: string): boolean {
    return url === '/proveedor' || url.startsWith('/proveedor/leads') || url.startsWith('/proveedor?');
  }

  private isLeadDetailUrl(url: string): boolean {
    return /^\/proveedor\/leads\/[^/]+$/.test(url.split('?')[0]);
  }
}
