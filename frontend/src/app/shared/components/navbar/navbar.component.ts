import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { AuthService } from '../../../core/services/auth.service';
import { UserRole } from '../../../core/models/models';

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
          <a mat-button routerLink="/solicitar">Necesito un servicio</a>
          <a mat-button routerLink="/proveedores/registro">Ofrezco servicios</a>
          <a mat-button routerLink="/login">Iniciar sesión</a>
        } @else {
          @if (auth.hasRole(role.CUSTOMER)) {
            <a mat-button routerLink="/mis-solicitudes" routerLinkActive="active">Mis solicitudes</a>
          }
          @if (auth.hasRole(role.PROVIDER)) {
            <a mat-button routerLink="/proveedor" routerLinkActive="active">Mi panel</a>
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
            <a mat-menu-item routerLink="/proveedor">Mi panel</a>
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
        padding: 0.75rem 1.5rem;
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
        color: var(--eslm-accent);
      }
      .links {
        display: flex;
        align-items: center;
        gap: 0.25rem;
      }
      .active {
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
  readonly role = UserRole;
  constructor(readonly auth: AuthService) {}
}
