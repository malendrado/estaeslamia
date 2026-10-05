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
        padding: 2rem 1rem 4rem;
      }
      .tabs {
        display: flex;
        gap: 1.5rem;
        border-bottom: 1px solid #eee;
        margin-bottom: 1.5rem;
        flex-wrap: wrap;
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
export class AdminLayoutComponent {}
