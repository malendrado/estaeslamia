import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <div class="admin-shell">
      <h1>Panel de administración</h1>
      <nav class="tabs">
        <a routerLink="/admin" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">Resumen</a>
        <a routerLink="/admin/solicitudes" routerLinkActive="active">Solicitudes</a>
        <a routerLink="/admin/leads" routerLinkActive="active">Leads</a>
        <a routerLink="/admin/providers" routerLinkActive="active">Empresas</a>
        <a routerLink="/admin/categorias" routerLinkActive="active">Categorías</a>
        <a routerLink="/admin/usuarios" routerLinkActive="active">Usuarios</a>
      </nav>
      <div class="tab-content">
        <router-outlet></router-outlet>
      </div>
    </div>
  `,
  styles: [
    `
      .admin-shell {
        max-width: 1080px;
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
export class AdminLayoutComponent {}
