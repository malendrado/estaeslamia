import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { CatalogService } from '../core/services/catalog.service';
import { ProvidersService } from '../core/services/providers.service';
import { SeoService } from '../core/services/seo.service';
import { AnalyticsService } from '../core/services/analytics.service';
import { Category, Service } from '../core/models/models';

const ACCENTS = ['var(--eslm-primary)', 'var(--eslm-accent)', 'var(--eslm-accent-2)', 'var(--eslm-accent-3)'];
// Variantes AA-safe (4.5:1) de ACCENTS, para usar donde el color pinta texto en vez de borde/ícono decorativo.
const ACCENTS_TEXT = [
  'var(--eslm-primary-dark)',
  'var(--eslm-accent-ink)',
  'var(--eslm-accent-2-ink)',
  'var(--eslm-accent-3)',
];

interface Stat {
  value: number;
  suffix: string;
  label: string;
}

interface Faq {
  question: string;
  answer: string;
}

interface FeaturedProvider {
  id: string;
  businessName: string;
  description: string | null;
  logoUrl: string | null;
  services: string[];
}

const FAQS: Faq[] = [
  {
    question: '¿Publicar una solicitud tiene costo?',
    answer: 'No. Publicar tu solicitud como cliente es gratis. Nunca te pedimos pago para conectarte con empresas.',
  },
  {
    question: '¿Las empresas están verificadas?',
    answer:
      'Toda empresa que se registra queda en estado "pendiente" hasta que un administrador revisa y aprueba su cuenta. Solo empresas activas pueden recibir solicitudes.',
  },
  {
    question: '¿Qué pasa con mis datos de contacto?',
    answer:
      'Solo se comparten con las empresas que coincidan con tu solicitud (mismo servicio y comuna), y únicamente después de que aceptas el consentimiento explícito en el formulario.',
  },
  {
    question: '¿Puedo registrarme si soy un profesional independiente, no una empresa formal?',
    answer: 'Sí. La plataforma acepta tanto empresas constituidas como profesionales independientes que ofrezcan servicios.',
  },
  {
    question: '¿Cómo elijo con qué empresa trabajar?',
    answer:
      'Las empresas interesadas te contactan directamente por teléfono, WhatsApp o email. Tú decides con cuál avanzar — nosotros no intervenimos en esa decisión.',
  },
];

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule, MatIconModule, MatExpansionModule],
  template: `
    <!-- HERO -->
    <section class="hero">
      <div class="hero-copy">
        <h1>Encuentra a quien<br />puede ayudarte.</h1>
        <p>Cuéntanos qué necesitas y conecta con empresas y profesionales que pueden hacerlo. Sin registro, sin vueltas.</p>
        <div class="cta-row">
          <a class="btn btn-primary" routerLink="/solicitar">Necesito un servicio</a>
          <a class="btn btn-outline" routerLink="/proveedores/registro">Ofrezco servicios</a>
        </div>
      </div>

      <div class="hero-stack" aria-hidden="true">
        @for (cat of categories().slice(0, 5); track cat.id; let i = $index) {
          <div
            class="stack-chip"
            [style.background]="accentFor(i)"
            [style.color]="onColorFor(i)"
            [style.transform]="'rotate(' + rotationFor(i) + 'deg)'"
          >
            <mat-icon>{{ cat.icon || 'star' }}</mat-icon>
            <span>{{ cat.name }}</span>
          </div>
        }
      </div>
    </section>

    <!-- QUÉ ES / PROPÓSITO -->
    <section class="mission">
      <div class="mission-text">
        <h2>¿Qué es EstaEsLaMía.cl?</h2>
        <p>
          Todos los días, personas en Chile necesitan resolver algo — desde una filtración de agua hasta organizar
          un evento — y no saben a quién llamar. Al mismo tiempo, empresas y profesionales están buscando
          activamente nuevos clientes en su zona.
        </p>
        <p>
          <strong>EstaEsLaMía.cl conecta ambos lados.</strong> Tú cuentas qué necesitas, nosotros avisamos a las
          empresas que realmente ofrecen ese servicio en tu comuna, y ellas te contactan directamente. Sin
          intermediarios manejando la conversación, sin letra chica.
        </p>
      </div>
      <div class="mission-visual" aria-hidden="true">
        <div class="mission-card">
          <mat-icon style="color: var(--eslm-primary)">person</mat-icon>
          <span>Necesitas algo</span>
        </div>
        <mat-icon class="mission-arrow">arrow_forward</mat-icon>
        <div class="mission-card">
          <mat-icon style="color: var(--eslm-accent)">hub</mat-icon>
          <span>Te conectamos</span>
        </div>
        <mat-icon class="mission-arrow">arrow_forward</mat-icon>
        <div class="mission-card">
          <mat-icon style="color: var(--eslm-accent-2)">storefront</mat-icon>
          <span>Empresa real, tu comuna</span>
        </div>
      </div>
    </section>

    <!-- CIFRAS -->
    @if (stats().length > 0) {
      <section class="stats">
        <div class="stats-grid">
          @for (stat of stats(); track stat.label; let i = $index) {
            <div class="stat">
              <span class="stat-value" [style.color]="accentTextFor(i)">{{ stat.value }}{{ stat.suffix }}</span>
              <span class="stat-label">{{ stat.label }}</span>
            </div>
          }
        </div>
      </section>
    }

    <!-- CATEGORÍAS POPULARES -->
    @if (categories().length > 0) {
      <section class="categories">
        <h2>Categorías populares</h2>
        <div class="category-row">
          @for (cat of categories(); track cat.id; let i = $index) {
            <a class="category-pill" [style.borderColor]="accentFor(i)" routerLink="/solicitar">
              <mat-icon [style.color]="accentFor(i)">{{ cat.icon || 'star' }}</mat-icon>
              <span>{{ cat.name }}</span>
            </a>
          }
        </div>
      </section>
    }

    <!-- CÓMO FUNCIONA -->
    <section class="how-it-works">
      <h2>Cómo funciona</h2>
      <div class="timeline">
        <div class="timeline-step">
          <div class="step-marker" style="background: var(--eslm-primary)">1</div>
          <h3>Cuéntanos qué necesitas</h3>
          <p>Elige el servicio, tu comuna y describe brevemente tu necesidad. Menos de 2 minutos.</p>
        </div>
        <div class="timeline-step">
          <div class="step-marker" style="background: var(--eslm-accent); color: var(--eslm-ink)">2</div>
          <h3>Buscamos empresas</h3>
          <p>Encontramos empresas y profesionales activos que ofrecen ese servicio en tu zona.</p>
        </div>
        <div class="timeline-step">
          <div class="step-marker" style="background: var(--eslm-accent-2); color: var(--eslm-ink)">3</div>
          <h3>Te contactan</h3>
          <p>Las empresas interesadas reciben tu solicitud y se ponen en contacto directamente contigo.</p>
        </div>
      </div>
    </section>

    <!-- SERVICIOS MÁS SOLICITADOS -->
    @if (services().length > 0) {
      <section class="services">
        <h2>Servicios disponibles</h2>
        <p class="services-subtitle">Más de {{ services().length }} servicios en {{ categories().length }} categorías, y creciendo.</p>
        <div class="service-grid">
          @for (svc of services(); track svc.id) {
            <a class="service-chip" [routerLink]="['/servicios', svc.slug]">{{ svc.name }}</a>
          }
        </div>
      </section>
    }

    <!-- EMPRESAS DESTACADAS -->
    @if (featuredProviders().length > 0) {
      <section class="providers">
        <h2>Empresas en la plataforma</h2>
        <p class="providers-subtitle">Algunas de las empresas activas listas para recibir tu solicitud.</p>
        <div class="provider-grid">
          @for (provider of featuredProviders(); track provider.id; let i = $index) {
            <div class="provider-card" [style.borderTopColor]="accentFor(i)">
              <div class="provider-header">
                @if (provider.logoUrl) {
                  <img [src]="provider.logoUrl" [alt]="'Logo de ' + provider.businessName" class="provider-logo" />
                }
                <h4>{{ provider.businessName }}</h4>
              </div>
              @if (provider.description) {
                <p class="provider-desc">{{ provider.description }}</p>
              }
              @if (provider.services.length > 0) {
                <div class="provider-services">
                  @for (svc of provider.services.slice(0, 3); track svc) {
                    <span class="mini-chip">{{ svc }}</span>
                  }
                </div>
              }
            </div>
          }
        </div>
        <div class="providers-cta">
          <a class="btn btn-outline" routerLink="/proveedores/registro">Súmate como empresa</a>
        </div>
      </section>
    }

    <!-- PARA CLIENTES / PARA EMPRESAS -->
    <section class="split">
      <div class="split-panel panel-primary">
        <mat-icon class="split-icon">person_search</mat-icon>
        <h3>Para clientes</h3>
        <p>Sin registro obligatorio, sin formularios eternos. Publica lo que necesitas y listo.</p>
        <a class="btn btn-light" routerLink="/solicitar">Solicitar un servicio</a>
      </div>
      <div class="split-panel panel-ink">
        <mat-icon class="split-icon">storefront</mat-icon>
        <h3>Para empresas</h3>
        <p>Recibe oportunidades reales de clientes que buscan exactamente lo que ofreces, en tu zona.</p>
        <a class="btn btn-light" routerLink="/proveedores/registro">Registrar mi empresa</a>
      </div>
    </section>

    <!-- BENEFICIOS -->
    <section class="benefits">
      <h2>Por qué EstaEsLaMía.cl</h2>
      <div class="benefit-grid">
        <div class="benefit">
          <mat-icon style="color: var(--eslm-primary)">bolt</mat-icon>
          <h4>Rápido</h4>
          <p>Publica tu solicitud en menos de 2 minutos, desde el celular.</p>
        </div>
        <div class="benefit">
          <mat-icon style="color: var(--eslm-accent)">verified_user</mat-icon>
          <h4>Empresas activas</h4>
          <p>Solo los negocios que realmente ofrecen ese servicio en tu comuna reciben tu solicitud.</p>
        </div>
        <div class="benefit">
          <mat-icon style="color: var(--eslm-accent-2)">lock</mat-icon>
          <h4>Tus datos, con consentimiento</h4>
          <p>Tú decides compartir tu información. Nada se envía sin tu aprobación explícita.</p>
        </div>
        <div class="benefit">
          <mat-icon style="color: var(--eslm-accent-3)">groups</mat-icon>
          <h4>Sin intermediarios</h4>
          <p>Las empresas te contactan directamente. Tú coordinas los detalles con ellas.</p>
        </div>
      </div>
    </section>

    <!-- FAQ -->
    <section class="faq">
      <h2>Preguntas frecuentes</h2>
      <mat-accordion displayMode="flat">
        @for (faq of faqs; track faq.question) {
          <mat-expansion-panel>
            <mat-expansion-panel-header>
              <mat-panel-title>{{ faq.question }}</mat-panel-title>
            </mat-expansion-panel-header>
            <p>{{ faq.answer }}</p>
          </mat-expansion-panel>
        }
      </mat-accordion>
    </section>

    <!-- CTA FINAL -->
    <section class="final-cta">
      <h2>¿Listo para resolverlo?</h2>
      <a class="btn btn-light" routerLink="/solicitar">Necesito un servicio</a>
    </section>
  `,
  styles: [
    `
      section {
        max-width: 1080px;
        margin: 0 auto;
        padding: 4rem 1.5rem;
      }

      .btn {
        display: inline-block;
        padding: 0.85rem 1.6rem;
        border-radius: 999px;
        font-weight: 600;
        text-decoration: none;
        font-size: 0.98rem;
        transition: transform 0.15s ease;
      }
      .btn:hover {
        transform: translateY(-2px);
      }
      .btn-primary {
        background: var(--eslm-accent);
        color: var(--eslm-ink);
      }
      .btn-outline {
        border: 2px solid var(--eslm-ink);
        color: var(--eslm-ink);
      }
      .btn-light {
        background: #fff;
        color: var(--eslm-ink);
      }

      /* HERO */
      .hero {
        display: grid;
        grid-template-columns: 1.1fr 0.9fr;
        gap: 3rem;
        align-items: center;
        padding-top: 4.5rem;
        animation: rise 0.6s ease both;
      }
      .hero h1 {
        font-size: 3.1rem;
        line-height: 1.05;
        margin: 0 0 1.25rem;
        color: var(--eslm-ink);
      }
      .hero-copy p {
        font-size: 1.15rem;
        color: #4a5170;
        max-width: 460px;
        margin-bottom: 2rem;
      }
      .cta-row {
        display: flex;
        gap: 1rem;
        flex-wrap: wrap;
      }
      .hero-stack {
        position: relative;
        min-height: 320px;
      }
      .stack-chip {
        position: absolute;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.9rem 1.3rem;
        border-radius: 16px;
        font-weight: 600;
        box-shadow: 0 12px 24px -8px rgba(22, 33, 62, 0.35);
        width: fit-content;
      }
      .stack-chip:nth-child(1) { top: 0; left: 10%; }
      .stack-chip:nth-child(2) { top: 60px; left: 45%; }
      .stack-chip:nth-child(3) { top: 140px; left: 5%; }
      .stack-chip:nth-child(4) { top: 200px; left: 40%; }
      .stack-chip:nth-child(5) { top: 270px; left: 12%; }

      @keyframes rise {
        from { opacity: 0; transform: translateY(14px); }
        to { opacity: 1; transform: translateY(0); }
      }

      /* MISSION */
      .mission {
        display: grid;
        grid-template-columns: 1.1fr 0.9fr;
        gap: 3rem;
        align-items: center;
        padding-top: 2rem;
      }
      .mission-text h2 {
        text-align: left;
        font-size: 1.9rem;
        margin-bottom: 1rem;
      }
      .mission-text p {
        color: #4a5170;
        font-size: 1.02rem;
        line-height: 1.6;
        margin-bottom: 1rem;
      }
      .mission-text strong {
        color: var(--eslm-ink);
      }
      .mission-visual {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
      }
      .mission-card {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.4rem;
        background: #fafaf8;
        border: 1px solid #eee;
        border-radius: 12px;
        padding: 1.1rem 1.5rem;
        width: 100%;
        max-width: 240px;
        text-align: center;
        font-size: 0.85rem;
        font-weight: 600;
        color: var(--eslm-ink);
      }
      .mission-card mat-icon {
        font-size: 1.8rem;
        width: 1.8rem;
        height: 1.8rem;
      }
      .mission-arrow {
        color: #c7c2b3;
        transform: rotate(90deg);
      }

      /* STATS */
      .stats {
        padding-top: 0;
        padding-bottom: 2rem;
      }
      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
        gap: 1.5rem;
        border-top: 1px solid #eee;
        border-bottom: 1px solid #eee;
        padding: 2rem 0;
      }
      .stat {
        text-align: center;
      }
      .stat-value {
        display: block;
        font-family: var(--eslm-font-display);
        font-size: 2.4rem;
        font-weight: 700;
      }
      .stat-label {
        font-size: 0.85rem;
        color: #4a5170;
      }

      /* CATEGORIES */
      .categories h2,
      .how-it-works h2,
      .services h2,
      .benefits h2,
      .faq h2,
      .final-cta h2 {
        text-align: center;
        font-size: 2rem;
        margin-bottom: 1rem;
        color: var(--eslm-ink);
      }
      .category-row {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 0.9rem;
        margin-top: 1rem;
      }
      .category-pill {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.6rem 1.1rem;
        border-radius: 999px;
        border: 2px solid;
        text-decoration: none;
        color: var(--eslm-ink);
        font-weight: 600;
        font-size: 0.92rem;
        transition: transform 0.15s ease;
      }
      .category-pill:hover {
        transform: translateY(-2px);
      }

      /* TIMELINE */
      .timeline {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 2.5rem;
        position: relative;
        margin-top: 2rem;
      }
      .timeline-step {
        text-align: center;
      }
      .step-marker {
        width: 44px;
        height: 44px;
        border-radius: 50%;
        color: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: var(--eslm-font-display);
        font-weight: 700;
        margin: 0 auto 1rem;
      }
      .timeline-step h3 {
        margin: 0 0 0.4rem;
        font-size: 1.1rem;
      }
      .timeline-step p {
        color: #4a5170;
        font-size: 0.92rem;
      }

      /* SERVICES */
      .services-subtitle {
        text-align: center;
        color: #4a5170;
        margin: -0.5rem 0 1.5rem;
      }
      .service-grid {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 0.6rem;
      }
      .service-chip {
        padding: 0.45rem 0.9rem;
        border-radius: 999px;
        background: #fafaf8;
        border: 1px solid #eee;
        color: var(--eslm-ink);
        text-decoration: none;
        font-size: 0.85rem;
        font-weight: 500;
        transition: background 0.15s ease, transform 0.15s ease;
      }
      .service-chip:hover {
        background: #f0ede2;
        transform: translateY(-1px);
      }

      /* PROVIDERS */
      .providers-subtitle {
        text-align: center;
        color: #4a5170;
        margin: -0.5rem 0 2rem;
      }
      .provider-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 1.25rem;
      }
      .provider-card {
        background: #fff;
        border: 1px solid #eee;
        border-top: 3px solid transparent;
        border-radius: 10px;
        padding: 1.25rem;
      }
      .provider-header {
        display: flex;
        align-items: center;
        gap: 0.65rem;
        margin-bottom: 0.4rem;
      }
      .provider-logo {
        width: 36px;
        height: 36px;
        border-radius: 8px;
        object-fit: cover;
        border: 1px solid #eee;
        flex-shrink: 0;
      }
      .provider-card h4 {
        margin: 0;
        font-family: var(--eslm-font-display);
        font-size: 1.05rem;
        color: var(--eslm-ink);
      }
      .provider-desc {
        color: #4a5170;
        font-size: 0.88rem;
        margin: 0 0 0.75rem;
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
      }
      .provider-services {
        display: flex;
        flex-wrap: wrap;
        gap: 0.4rem;
      }
      .mini-chip {
        font-size: 0.75rem;
        padding: 0.2rem 0.6rem;
        border-radius: 999px;
        background: #fafaf8;
        border: 1px solid #eee;
        color: #4a5170;
      }
      .providers-cta {
        text-align: center;
        margin-top: 2rem;
      }

      /* SPLIT */
      .split {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1.5rem;
      }
      .split-panel {
        padding: 2.5rem 2rem;
        border-radius: 20px;
        color: #fff;
        box-shadow: 0 16px 32px -16px rgba(22, 33, 62, 0.3);
        transition: transform 0.15s ease;
      }
      .split-panel:hover {
        transform: translateY(-3px);
      }
      .split-icon {
        font-size: 2rem;
        width: 2rem;
        height: 2rem;
        opacity: 0.85;
        margin-bottom: 0.75rem;
      }
      .split-panel h3 {
        font-size: 1.5rem;
        margin-bottom: 0.6rem;
        color: #fff;
      }
      .split-panel p {
        opacity: 0.9;
        max-width: 360px;
        margin-bottom: 1.5rem;
      }
      .panel-primary {
        background: var(--eslm-primary);
      }
      .panel-ink {
        background: var(--eslm-ink);
      }

      /* BENEFITS */
      .benefit-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 2rem;
        margin-top: 2rem;
      }
      .benefit {
        text-align: center;
      }
      .benefit mat-icon {
        font-size: 2.2rem;
        width: 2.2rem;
        height: 2.2rem;
      }
      .benefit h4 {
        margin: 0.6rem 0 0.3rem;
      }
      .benefit p {
        color: #4a5170;
        font-size: 0.9rem;
      }

      /* FAQ */
      .faq {
        max-width: 760px;
      }
      .faq mat-accordion {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        margin-top: 1.5rem;
      }
      .faq ::ng-deep mat-expansion-panel {
        border-radius: 16px !important;
        border: 1px solid #eee;
        box-shadow: 0 2px 10px rgba(22, 33, 62, 0.05) !important;
      }
      .faq ::ng-deep .mat-expansion-panel-header {
        padding: 0 1.5rem;
        height: 68px !important;
      }
      .faq ::ng-deep .mat-expansion-panel-header:hover {
        background: #fafaf8 !important;
      }
      .faq ::ng-deep .mat-expansion-panel-header-title {
        font-family: var(--eslm-font-display);
        font-weight: 600;
        font-size: 1.02rem;
        color: var(--eslm-ink);
      }
      .faq ::ng-deep .mat-expansion-panel-body {
        padding: 0 1.5rem 1.4rem;
        color: #4a5170;
        line-height: 1.6;
      }
      .faq ::ng-deep .mat-expansion-indicator::after {
        color: var(--eslm-primary);
      }

      /* FINAL CTA */
      .final-cta {
        text-align: center;
        background: var(--eslm-accent-3);
        max-width: none;
        color: #fff;
      }
      .final-cta h2 {
        color: #fff;
      }

      @media (max-width: 860px) {
        .hero {
          grid-template-columns: 1fr;
          padding-top: 2.5rem;
        }
        .hero-stack {
          display: none;
        }
        .mission {
          grid-template-columns: 1fr;
        }
        .mission-visual {
          flex-direction: row;
          flex-wrap: wrap;
          justify-content: center;
        }
        .mission-arrow {
          transform: rotate(0deg);
        }
        .split {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class HomeComponent implements OnInit {
  readonly categories = signal<Category[]>([]);
  readonly services = signal<Service[]>([]);
  readonly stats = signal<Stat[]>([]);
  readonly featuredProviders = signal<FeaturedProvider[]>([]);
  readonly faqs = FAQS;

  constructor(
    private readonly catalogService: CatalogService,
    private readonly providersService: ProvidersService,
    private readonly seoService: SeoService,
    private readonly analyticsService: AnalyticsService,
  ) {}

  ngOnInit(): void {
    this.seoService.set({
      title: 'Encuentra a quien puede ayudarte',
      description: 'Cuéntanos qué necesitas y conecta con empresas y profesionales que pueden hacerlo. Sin registro, sin vueltas.',
      path: '/',
    });
    this.analyticsService.track('PAGE_VIEW_HOME', '/');
    this.catalogService.getCategories().subscribe((cats) => this.categories.set(cats));
    this.catalogService.getServices().subscribe((services) => this.services.set(services));
    this.providersService.getFeatured().subscribe((providers) => this.featuredProviders.set(providers));
    this.catalogService.getPublicStats().subscribe((stats) => {
      this.stats.set([
        { value: stats.categoriesCount, suffix: '', label: 'Categorías de servicios' },
        { value: stats.servicesCount, suffix: '+', label: 'Servicios disponibles' },
        { value: stats.activeProvidersCount, suffix: '+', label: 'Empresas activas' },
        { value: stats.communesCoveredCount, suffix: '', label: 'Comunas con cobertura' },
      ]);
    });
  }

  accentFor(index: number): string {
    return ACCENTS[index % ACCENTS.length];
  }

  accentTextFor(index: number): string {
    return ACCENTS_TEXT[index % ACCENTS_TEXT.length];
  }

  // Color de texto legible (4.5:1+) sobre el fondo que da accentFor(i):
  // primary/accent-3 son oscuros y pasan con blanco; accent/accent-2 son
  // demasiado claros para texto blanco y necesitan texto oscuro (ink).
  onColorFor(index: number): string {
    const isLight = index % ACCENTS.length === 1 || index % ACCENTS.length === 2;
    return isLight ? 'var(--eslm-ink)' : '#fff';
  }

  rotationFor(index: number): number {
    const pattern = [-4, 3, -2, 4, -3];
    return pattern[index % pattern.length];
  }
}
