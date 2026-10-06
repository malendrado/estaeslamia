import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { CatalogService } from '../core/services/catalog.service';
import { SeoService } from '../core/services/seo.service';
import { Category, Service } from '../core/models/models';
import { LoadingComponent } from '../shared/components/loading/loading.component';

@Component({
  selector: 'app-service-landing',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule, LoadingComponent],
  template: `
    @if (loading()) {
      <app-loading></app-loading>
    } @else if (service()) {
      <section class="hero">
        <div class="eyebrow">
          <mat-icon>{{ category()?.icon || 'star' }}</mat-icon>
          <span>{{ category()?.name }}</span>
        </div>
        <h1>{{ service()!.name }} en tu comuna</h1>
        <p>
          Publica tu solicitud de <strong>{{ service()!.name | lowercase }}</strong> y te conectamos con empresas y
          profesionales activos que ofrecen este servicio en tu zona. Sin registro, sin vueltas.
        </p>
        <a
          class="btn btn-primary"
          [routerLink]="['/solicitar']"
          [queryParams]="{ categoryId: service()!.categoryId, serviceId: service()!.id }"
        >
          Solicitar {{ service()!.name | lowercase }}
        </a>
      </section>

      <section class="how-it-works">
        <h2>Cómo funciona</h2>
        <div class="timeline">
          <div class="timeline-step">
            <div class="step-marker" style="background: var(--eslm-primary)">1</div>
            <h3>Cuéntanos qué necesitas</h3>
            <p>Describe tu solicitud de {{ service()!.name | lowercase }} y elige tu comuna. Menos de 2 minutos.</p>
          </div>
          <div class="timeline-step">
            <div class="step-marker" style="background: var(--eslm-accent); color: var(--eslm-ink)">2</div>
            <h3>Buscamos empresas</h3>
            <p>Encontramos empresas activas que ofrecen {{ service()!.name | lowercase }} en tu zona.</p>
          </div>
          <div class="timeline-step">
            <div class="step-marker" style="background: var(--eslm-accent-2); color: var(--eslm-ink)">3</div>
            <h3>Te contactan</h3>
            <p>Las empresas interesadas se ponen en contacto contigo directamente.</p>
          </div>
        </div>
      </section>

      <section class="final-cta">
        <h2>¿Necesitas {{ service()!.name | lowercase }}?</h2>
        <a
          class="btn btn-light"
          [routerLink]="['/solicitar']"
          [queryParams]="{ categoryId: service()!.categoryId, serviceId: service()!.id }"
        >
          Solicitar ahora
        </a>
      </section>
    } @else {
      <div class="not-found">
        <h1>No encontramos este servicio</h1>
        <a routerLink="/">Volver al inicio</a>
      </div>
    }
  `,
  styles: [
    `
      section {
        max-width: 900px;
        margin: 0 auto;
        padding: 4rem 1.5rem;
      }
      .hero {
        text-align: center;
      }
      .eyebrow {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        color: var(--eslm-primary);
        font-weight: 600;
        font-size: 0.85rem;
        margin-bottom: 0.75rem;
      }
      .hero h1 {
        font-size: 2.4rem;
        margin-bottom: 1rem;
      }
      .hero p {
        color: #4a5170;
        font-size: 1.1rem;
        max-width: 560px;
        margin: 0 auto 2rem;
      }
      .btn {
        display: inline-block;
        padding: 0.85rem 1.6rem;
        border-radius: 999px;
        font-weight: 600;
        text-decoration: none;
        transition: transform 0.15s ease;
      }
      .btn:hover {
        transform: translateY(-2px);
      }
      .btn-primary {
        background: var(--eslm-accent);
        color: var(--eslm-ink);
      }
      .btn-light {
        background: #fff;
        color: var(--eslm-ink);
      }
      .how-it-works h2,
      .final-cta h2 {
        text-align: center;
        margin-bottom: 2rem;
      }
      .timeline {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 2rem;
      }
      .timeline-step {
        text-align: center;
      }
      .step-marker {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        color: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: var(--eslm-font-display);
        font-weight: 700;
        margin: 0 auto 0.75rem;
      }
      .timeline-step p {
        color: #4a5170;
        font-size: 0.9rem;
      }
      .final-cta {
        text-align: center;
        background: var(--eslm-accent-3);
        max-width: none;
        color: #fff;
      }
      .final-cta h2 {
        color: #fff;
      }
      .not-found {
        text-align: center;
        padding: 4rem 1.5rem;
      }
    `,
  ],
})
export class ServiceLandingComponent implements OnInit {
  readonly loading = signal(true);
  readonly service = signal<Service | null>(null);
  readonly category = signal<Category | null>(null);

  constructor(
    private readonly route: ActivatedRoute,
    private readonly catalogService: CatalogService,
    private readonly seoService: SeoService,
  ) {}

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug');
    if (!slug) {
      this.loading.set(false);
      return;
    }

    this.catalogService.getServiceBySlug(slug).subscribe({
      next: (service) => {
        this.service.set(service);
        this.catalogService.getCategories().subscribe((categories) => {
          this.category.set(categories.find((c) => c.id === service.categoryId) ?? null);
          this.seoService.set({
            title: `${service.name} — encuentra empresas cerca de ti`,
            description: `Publica tu solicitud de ${service.name.toLowerCase()} y conecta con empresas y profesionales activos en tu comuna. Sin registro, sin vueltas.`,
            path: `/servicios/${service.slug}`,
          });
          this.loading.set(false);
        });
      },
      error: () => this.loading.set(false),
    });
  }
}
