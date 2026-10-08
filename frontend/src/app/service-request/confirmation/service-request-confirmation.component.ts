import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ServiceRequestsService } from '../../core/services/service-requests.service';
import { SeoService } from '../../core/services/seo.service';
import { AuthService } from '../../core/services/auth.service';
import { ServiceRequestSummary, UserRole } from '../../core/models/models';
import { LoadingComponent } from '../../shared/components/loading/loading.component';

@Component({
  selector: 'app-service-request-confirmation',
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule, MatIconModule, LoadingComponent],
  template: `
    <div class="confirmation-page">
      @if (loading()) {
        <app-loading></app-loading>
      } @else if (summary()) {
        <div class="card">
          <mat-icon class="check">check_circle</mat-icon>
          <h1>¡Solicitud enviada!</h1>
          <p class="request-id">N° de solicitud: <code>{{ summary()!.id }}</code></p>

          @if (summary()!.matchesCount > 0) {
            <p class="matches">
              Encontramos <strong>{{ summary()!.matchesCount }}</strong>
              {{ summary()!.matchesCount === 1 ? 'empresa' : 'empresas' }} que pueden ayudarte con
              <strong>{{ summary()!.service }}</strong> en <strong>{{ summary()!.commune }}</strong>.
              Pronto se pondrán en contacto contigo.
            </p>
          } @else {
            <p class="matches">
              Por ahora no encontramos empresas disponibles para <strong>{{ summary()!.service }}</strong> en
              <strong>{{ summary()!.commune }}</strong>. Guardamos tu solicitud y te avisaremos apenas haya alguna.
            </p>
          }

          <div class="actions">
            @if (isLoggedInCustomer()) {
              <a mat-flat-button color="primary" [routerLink]="['/mis-solicitudes', summary()!.id]">Ir a mis solicitudes</a>
            } @else {
              <a mat-flat-button color="primary" routerLink="/registro">Crear cuenta para seguir mi solicitud</a>
            }
            <a mat-button routerLink="/">Volver al inicio</a>
          </div>
        </div>
      } @else {
        <p>No pudimos encontrar esta solicitud.</p>
      }
    </div>
  `,
  styles: [
    `
      .confirmation-page {
        max-width: 520px;
        margin: 0 auto;
        padding: 3rem 1rem;
      }
      .card {
        background: #fff;
        border: 1px solid #eee;
        border-radius: 16px;
        box-shadow: 0 16px 32px -20px rgba(22, 33, 62, 0.15);
        padding: 2.25rem 1.75rem;
        text-align: center;
      }
      .check {
        color: var(--eslm-primary);
        font-size: 3rem;
        width: 3rem;
        height: 3rem;
      }
      .request-id code {
        background: #f2f2f2;
        padding: 2px 8px;
        border-radius: 4px;
      }
      .matches {
        color: #444;
        margin: 1rem 0 2rem;
      }
      .actions {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        align-items: center;
      }
    `,
  ],
})
export class ServiceRequestConfirmationComponent implements OnInit {
  readonly loading = signal(true);
  readonly summary = signal<ServiceRequestSummary | null>(null);
  readonly isLoggedInCustomer = computed(() => this.authService.hasRole(UserRole.CUSTOMER));

  constructor(
    private readonly route: ActivatedRoute,
    private readonly serviceRequestsService: ServiceRequestsService,
    private readonly seoService: SeoService,
    private readonly authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.seoService.set({
      title: 'Solicitud enviada',
      description: 'Tu solicitud fue enviada con éxito.',
      path: this.route.snapshot.url.map((s) => s.path).join('/'),
      noindex: true,
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.loading.set(false);
      return;
    }
    this.serviceRequestsService.getPublicSummary(id).subscribe({
      next: (summary) => {
        this.summary.set(summary);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
