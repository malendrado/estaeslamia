import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import { ServiceRequestsService } from '../../core/services/service-requests.service';
import { LeadsService } from '../../core/services/leads.service';
import { ProvidersService } from '../../core/services/providers.service';
import { Lead, LeadStatus, ServiceRequest } from '../../core/models/models';
import { AnalyticsService, AnalyticsSummary } from '../../core/services/analytics.service';
import { LoadingComponent } from '../../shared/components/loading/loading.component';

@Component({
  selector: 'app-admin-overview',
  standalone: true,
  imports: [CommonModule, LoadingComponent],
  template: `
    <p class="tab-description">Métricas generales de la plataforma: volumen de empresas, solicitudes y leads, y el embudo de conversión.</p>

    @if (loading()) {
      <app-loading></app-loading>
    } @else {
      <div class="cards">
        <div class="card" style="border-top-color: var(--eslm-primary)">
          <span class="value" style="color: var(--eslm-primary)">{{ providersCount() }}</span>
          <span class="label">Empresas registradas</span>
        </div>
        <div class="card" style="border-top-color: var(--eslm-accent)">
          <span class="value" style="color: var(--eslm-accent-ink)">{{ requestsCount() }}</span>
          <span class="label">Solicitudes</span>
        </div>
        <div class="card" style="border-top-color: var(--eslm-accent-2)">
          <span class="value" style="color: var(--eslm-accent-2-ink)">{{ leadsCount() }}</span>
          <span class="label">Leads generados</span>
        </div>
        <div class="card" style="border-top-color: var(--eslm-accent-3)">
          <span class="value" style="color: var(--eslm-accent-3)">{{ matchRate() }}%</span>
          <span class="label">Solicitudes con match</span>
        </div>
      </div>

      @if (avgResponseTime() || avgConversionTime()) {
        <h3 class="section-title">Tiempos del ciclo de vida</h3>
        <div class="cards timing-cards">
          @if (avgResponseTime()) {
            <div class="card" style="border-top-color: var(--eslm-accent-2)">
              <span class="value" style="color: var(--eslm-accent-2-ink)">{{ avgResponseTime() }}</span>
              <span class="label">Tiempo prom. hasta contactar</span>
            </div>
          }
          @if (avgConversionTime()) {
            <div class="card" style="border-top-color: var(--eslm-primary)">
              <span class="value" style="color: var(--eslm-primary)">{{ avgConversionTime() }}</span>
              <span class="label">Tiempo prom. hasta conversión</span>
            </div>
          }
        </div>
      }

      @if (funnel()) {
        <div class="funnel">
          <h3>Embudo de conversión <span class="funnel-period">(últimos {{ funnel()!.sinceDays }} días)</span></h3>
          <div class="funnel-steps">
            <div class="funnel-step">
              <span class="funnel-value">{{ funnel()!.counts.PAGE_VIEW_HOME }}</span>
              <span class="funnel-label">Visitas al inicio</span>
            </div>
            <span class="funnel-arrow">→</span>
            <div class="funnel-step">
              <span class="funnel-value">{{ funnel()!.counts.WIZARD_STARTED }}</span>
              <span class="funnel-label">Iniciaron el wizard</span>
            </div>
            <span class="funnel-arrow">→</span>
            <div class="funnel-step">
              <span class="funnel-value">{{ funnel()!.counts.SERVICE_REQUEST_CREATED }}</span>
              <span class="funnel-label">Solicitudes creadas</span>
            </div>
          </div>
          <div class="funnel-steps secondary">
            <div class="funnel-step">
              <span class="funnel-value">{{ funnel()!.counts.CUSTOMER_REGISTERED }}</span>
              <span class="funnel-label">Clientes registrados</span>
            </div>
            <div class="funnel-step">
              <span class="funnel-value">{{ funnel()!.counts.PROVIDER_REGISTERED }}</span>
              <span class="funnel-label">Empresas registradas</span>
            </div>
          </div>
        </div>
      }

      <div class="breakdowns">
        <div class="breakdown">
          <h3>Conversión por empresa</h3>
          <ul>
            @for (item of conversionByProvider(); track item.name) {
              <li>
                <span>{{ item.name }}</span>
                <strong>{{ item.rate }}% <span class="muted">({{ item.converted }}/{{ item.total }})</span></strong>
              </li>
            }
          </ul>
        </div>
        <div class="breakdown">
          <h3>Conversión por servicio</h3>
          <ul>
            @for (item of conversionByService(); track item.name) {
              <li>
                <span>{{ item.name }}</span>
                <strong>{{ item.rate }}% <span class="muted">({{ item.converted }}/{{ item.total }})</span></strong>
              </li>
            }
          </ul>
        </div>
        <div class="breakdown">
          <h3>Conversión por comuna</h3>
          <ul>
            @for (item of conversionByCommune(); track item.name) {
              <li>
                <span>{{ item.name }}</span>
                <strong>{{ item.rate }}% <span class="muted">({{ item.converted }}/{{ item.total }})</span></strong>
              </li>
            }
          </ul>
        </div>
      </div>
    }
  `,
  styles: [
    `
      .cards {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 1rem;
        margin-bottom: 2rem;
      }
      .card {
        background: #fff;
        border: 1px solid #eee;
        border-top: 3px solid transparent;
        border-radius: 8px;
        padding: 1.25rem;
        display: flex;
        flex-direction: column;
        align-items: center;
        transition: transform 0.15s ease, box-shadow 0.15s ease;
      }
      .card:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 20px -14px rgba(22, 33, 62, 0.25);
      }
      .card .value {
        font-size: 1.8rem;
        font-weight: 700;
        font-family: var(--eslm-font-display);
      }
      .card .label {
        font-size: 0.8rem;
        color: #757575;
        text-align: center;
      }
      .funnel {
        background: #fff;
        border: 1px solid #eee;
        border-radius: 8px;
        padding: 1.25rem 1.5rem;
        margin-bottom: 2rem;
      }
      .funnel h3 {
        font-size: 0.95rem;
        margin: 0 0 1rem;
      }
      .funnel-period {
        color: #999;
        font-weight: 400;
        font-size: 0.82rem;
      }
      .funnel-steps {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 1.25rem;
        flex-wrap: wrap;
      }
      .funnel-steps.secondary {
        margin-top: 1.25rem;
        padding-top: 1.25rem;
        border-top: 1px dashed #eee;
        gap: 2.5rem;
      }
      .funnel-step {
        display: flex;
        flex-direction: column;
        align-items: center;
        min-width: 110px;
      }
      .funnel-value {
        font-family: var(--eslm-font-display);
        font-size: 1.6rem;
        font-weight: 700;
        color: var(--eslm-primary);
      }
      .funnel-label {
        font-size: 0.78rem;
        color: #757575;
        text-align: center;
      }
      .funnel-arrow {
        color: #ccc;
        font-size: 1.3rem;
      }
      .breakdowns {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 2rem;
      }
      .breakdown h3 {
        font-size: 0.95rem;
        margin-bottom: 0.5rem;
      }
      .breakdown ul {
        list-style: none;
        padding: 0;
        margin: 0;
      }
      .breakdown li {
        display: flex;
        justify-content: space-between;
        padding: 0.4rem 0;
        border-bottom: 1px solid #f2f2f2;
        font-size: 0.9rem;
      }
      .muted {
        color: #999;
        font-weight: 400;
        font-size: 0.8rem;
      }
      .section-title {
        font-size: 0.95rem;
        margin: 0 0 1rem;
      }
      .timing-cards {
        max-width: 420px;
        margin-bottom: 2rem;
      }
    `,
  ],
})
export class AdminOverviewComponent implements OnInit {
  /**
   * Límite alto para esta pantalla específicamente: los conteos superiores usan
   * `.total` (exacto, viene del backend sin importar la página), pero las tasas de
   * conversión, los tiempos promedio y la tasa de match se calculan en el cliente
   * sobre `.data`, así que necesitan ver (casi) todos los registros. Para volúmenes grandes
   * lo correcto sería un endpoint de agregación en el backend (GROUP BY en SQL);
   * esto es la solución pragmática para el tamaño de datos de un MVP.
   */
  private static readonly AGGREGATION_LIMIT = 500;

  readonly loading = signal(true);
  readonly requests = signal<ServiceRequest[]>([]);
  readonly leads = signal<Lead[]>([]);
  readonly providersCount = signal(0);
  readonly requestsCount = signal(0);
  readonly leadsCount = signal(0);
  readonly funnel = signal<AnalyticsSummary | null>(null);

  readonly matchRate = computed(() => {
    const total = this.requests().length;
    if (total === 0) return 0;
    const matched = this.requests().filter((r) => r.status !== 'SUBMITTED').length;
    return Math.round((matched / total) * 100);
  });

  readonly conversionByProvider = computed(() =>
    this.groupConversion(this.leads(), (l) => l.provider?.businessName).slice(0, 8),
  );
  readonly conversionByService = computed(() => this.groupConversion(this.leads(), (l) => l.serviceRequest?.service?.name));
  readonly conversionByCommune = computed(() => this.groupConversion(this.leads(), (l) => l.serviceRequest?.commune?.name));

  // ponytail: "tiempo hasta conversión" usa updatedAt como proxy de "cuándo se marcó CONVERTED" en
  // vez de una columna convertedAt dedicada — es seguro porque CONVERTED es terminal (ver
  // LEAD_VALID_TRANSITIONS en el backend): nada vuelve a tocar el lead después. Si en el futuro se
  // necesita reconstruir tiempos de TODAS las transiciones (no solo la última), ahí sí hace falta
  // una columna por estado.
  readonly avgResponseTime = computed(() => {
    const withContact = this.leads().filter((l) => l.contactedAt);
    if (withContact.length === 0) return null;
    const avgHours = withContact.reduce((sum, l) => sum + this.diffHours(l.createdAt, l.contactedAt!), 0) / withContact.length;
    return this.formatDuration(avgHours);
  });

  readonly avgConversionTime = computed(() => {
    const converted = this.leads().filter((l) => l.status === LeadStatus.CONVERTED);
    if (converted.length === 0) return null;
    const avgHours = converted.reduce((sum, l) => sum + this.diffHours(l.createdAt, l.updatedAt), 0) / converted.length;
    return this.formatDuration(avgHours);
  });

  constructor(
    private readonly serviceRequestsService: ServiceRequestsService,
    private readonly leadsService: LeadsService,
    private readonly providersService: ProvidersService,
    private readonly analyticsService: AnalyticsService,
  ) {}

  ngOnInit(): void {
    const limit = AdminOverviewComponent.AGGREGATION_LIMIT;
    forkJoin({
      requests: this.serviceRequestsService.getAllForAdmin({ page: 1, limit }),
      leads: this.leadsService.getAllForAdmin({ page: 1, limit }),
      providers: this.providersService.getAllForAdmin(undefined, 1, 1),
    }).subscribe(({ requests, leads, providers }) => {
      this.requests.set(requests.data);
      this.leads.set(leads.data);
      this.requestsCount.set(requests.total);
      this.leadsCount.set(leads.total);
      this.providersCount.set(providers.total);
      this.loading.set(false);
    });

    this.analyticsService.getSummary(30).subscribe({
      next: (summary) => this.funnel.set(summary),
      error: () => this.funnel.set(null),
    });
  }

  private groupConversion(
    leads: Lead[],
    keyFn: (lead: Lead) => string | undefined,
  ): Array<{ name: string; total: number; converted: number; rate: number }> {
    const map = new Map<string, { total: number; converted: number }>();
    for (const lead of leads) {
      const key = keyFn(lead) ?? 'Sin dato';
      const entry = map.get(key) ?? { total: 0, converted: 0 };
      entry.total += 1;
      if (lead.status === LeadStatus.CONVERTED) entry.converted += 1;
      map.set(key, entry);
    }
    return Array.from(map.entries())
      .map(([name, { total, converted }]) => ({ name, total, converted, rate: Math.round((converted / total) * 100) }))
      .sort((a, b) => b.total - a.total);
  }

  private diffHours(from: string, to: string): number {
    return (new Date(to).getTime() - new Date(from).getTime()) / (1000 * 60 * 60);
  }

  private formatDuration(hours: number): string {
    if (hours < 24) return `${hours.toFixed(1)} h`;
    return `${(hours / 24).toFixed(1)} días`;
  }
}
