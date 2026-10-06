import { Component, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { AuthService } from '../../../core/services/auth.service';
import { LeadsService } from '../../../core/services/leads.service';
import { LeadStatus, UserRole } from '../../../core/models/models';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, MatButtonModule, MatIconModule, MatMenuModule],
  template: `
    <header class="navbar">
      <a routerLink="/" class="brand">
        <svg class="brand-mark" viewBox="0 0 64 64" width="26" height="26" aria-hidden="true">
          <rect x="14" y="14" width="36" height="8" rx="4" fill="#0e8388" />
          <rect x="14" y="28" width="26" height="8" rx="4" fill="#ff6b4a" />
          <rect x="14" y="42" width="36" height="8" rx="4" fill="#ffb100" />
        </svg>
        <span class="brand-text">EstaEsLaMía<span class="brand-accent">.cl</span></span>
      </a>

      <!-- Links completos: visibles desde tablet hacia arriba -->
      <nav class="links desktop-links">
        @if (!auth.isLoggedIn()) {
          <a mat-button routerLink="/login">Iniciar sesión</a>
          <a class="nav-cta-outline" routerLink="/proveedores/registro">Ofrezco servicios</a>
          <a class="nav-cta-primary" routerLink="/solicitar">Necesito un servicio</a>
        } @else {
          @if (auth.hasRole(role.CUSTOMER)) {
            <a mat-button routerLink="/mis-solicitudes" routerLinkActive="active">Mis solicitudes</a>
          }
          @if (auth.hasRole(role.PROVIDER)) {
            <a mat-button routerLink="/proveedor" routerLinkActive="active" class="nav-link-with-badge">
              Mi panel
              @if (newLeadsCount() > 0) {
                <span class="badge">{{ newLeadsCount() }}</span>
              }
            </a>
          }
          @if (auth.hasRole(role.ADMIN)) {
            <a mat-button routerLink="/admin" routerLinkActive="active">Admin</a>
          }
          <button mat-icon-button [matMenuTriggerFor]="accountMenu" aria-label="Cuenta">
            <mat-icon>account_circle</mat-icon>
          </button>
          <mat-menu #accountMenu="matMenu">
            <div class="menu-user">{{ auth.currentUser()?.name }}</div>
            <button mat-menu-item (click)="auth.logout()">Cerrar sesión</button>
          </mat-menu>
        }
      </nav>

      <!-- Hamburguesa: solo mobile -->
      <button mat-icon-button class="mobile-toggle" [matMenuTriggerFor]="mobileMenu" aria-label="Abrir menú">
        <mat-icon>menu</mat-icon>
      </button>
      <mat-menu #mobileMenu="matMenu" class="mobile-menu">
        @if (!auth.isLoggedIn()) {
          <a mat-menu-item routerLink="/solicitar">Necesito un servicio</a>
          <a mat-menu-item routerLink="/proveedores/registro">Ofrezco servicios</a>
          <a mat-menu-item routerLink="/login">Iniciar sesión</a>
        } @else {
          @if (auth.hasRole(role.CUSTOMER)) {
            <a mat-menu-item routerLink="/mis-solicitudes">Mis solicitudes</a>
          }
          @if (auth.hasRole(role.PROVIDER)) {
            <a mat-menu-item routerLink="/proveedor">
              Mi panel
              @if (newLeadsCount() > 0) {
                <span class="badge">{{ newLeadsCount() }}</span>
              }
            </a>
          }
          @if (auth.hasRole(role.ADMIN)) {
            <a mat-menu-item routerLink="/admin">Admin</a>
          }
          <div class="menu-user">{{ auth.currentUser()?.name }}</div>
          <button mat-menu-item (click)="auth.logout()">Cerrar sesión</button>
        }
      </mat-menu>
    </header>
  `,
  styles: [
    `
      .navbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.9rem 1.5rem;
        border-bottom: 1px solid #eee;
        background: #fff;
      }
      .brand {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        text-decoration: none;
      }
      .brand-mark {
        flex-shrink: 0;
      }
      .brand-text {
        font-family: var(--eslm-font-display);
        font-weight: 700;
        font-size: 1.15rem;
        color: var(--eslm-ink);
      }
      .brand-accent {
        color: var(--eslm-accent-ink);
      }
      .links {
        display: flex;
        align-items: center;
        gap: 0.4rem;
      }
      .active {
        font-weight: 700;
        background: rgba(14, 131, 136, 0.08);
        border-radius: 999px;
      }
      .nav-cta-outline,
      .nav-cta-primary {
        display: inline-flex;
        align-items: center;
        padding: 0.5rem 1.1rem;
        border-radius: 999px;
        font-weight: 600;
        font-size: 0.9rem;
        text-decoration: none;
        transition: transform 0.15s ease;
      }
      .nav-cta-outline:hover,
      .nav-cta-primary:hover {
        transform: translateY(-1px);
      }
      .nav-cta-outline {
        border: 2px solid var(--eslm-ink);
        color: var(--eslm-ink);
      }
      .nav-cta-primary {
        background: var(--eslm-accent);
        color: var(--eslm-ink);
      }
      .nav-link-with-badge {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
      }
      .badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 18px;
        height: 18px;
        padding: 0 5px;
        border-radius: 999px;
        background: var(--eslm-accent);
        color: var(--eslm-ink);
        font-size: 0.72rem;
        font-weight: 700;
      }
      .menu-user {
        padding: 0.5rem 1rem;
        font-size: 0.85rem;
        color: #757575;
      }
      .mobile-toggle {
        display: none;
      }

      @media (max-width: 720px) {
        .desktop-links {
          display: none;
        }
        .mobile-toggle {
          display: inline-flex;
        }
      }
    `,
  ],
})
export class NavbarComponent {
  private readonly leadsService = inject(LeadsService);
  private readonly router = inject(Router);

  readonly role = UserRole;
  readonly newLeadsCount = signal(0);

  constructor(readonly auth: AuthService) {
    effect(() => {
      if (auth.hasRole(UserRole.PROVIDER)) {
        this.refreshNewLeadsCount();
      } else {
        this.newLeadsCount.set(0);
      }
    });

    // El conteo se puede quedar desactualizado si el provider revisa sus leads
    // sin recargar la página (el navbar es un componente de larga vida) —
    // se refresca en cada navegación para no mostrar un número viejo.
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => {
      if (auth.hasRole(UserRole.PROVIDER)) {
        this.refreshNewLeadsCount();
      }
    });
  }

  private refreshNewLeadsCount(): void {
    this.leadsService.getMine(LeadStatus.DELIVERED).subscribe({
      next: (leads) => this.newLeadsCount.set(leads.length),
      error: () => {},
    });
  }
}
