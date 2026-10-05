import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import { ServiceRequestsService } from '../../core/services/service-requests.service';
import { LeadsService } from '../../core/services/leads.service';
import { ProvidersService } from '../../core/services/providers.service';
import { Lead, ServiceRequest } from '../../core/models/models';
import { AnalyticsService, AnalyticsSummary } from '../../core/services/analytics.service';
import { LoadingComponent } from '../../shared/components/loading/loading.component';

@Component({
  selector: 'app-admin-overview',
  standalone: true,
  imports: [CommonModule, LoadingComponent],
  template: `
    @if (loading()) {
      <app-loading></app-loading>
    } @else {
      <div class="cards">
        <div class="card" style="border-top-color: var(--eslm-primary)">
          <span class="value" style="color: var(--eslm-primary)">{{ providersCount() }}</span>
          <span class="label">Empresas registradas</span>
        </div>
        <div class="card" style="border-top-color: var(--eslm-accent)">
          <span class="value" style="color: var(--eslm-accent)">{{ requestsCount() }}</span>
          <span class="label">Solicitudes</span>
        </div>
        <div class="card" style="border-top-color: var(--eslm-accent-2)">
          <span class="value" style="color: var(--eslm-accent-2)">{{ leadsCount() }}</span>
          <span class="label">Leads generados</span>
        </div>
        <div class="card" style="border-top-color: var(--eslm-accent-3)">
          <span class="value" style="color: var(--eslm-accent-3)">{{ matchRate() }}%</span>
          <span class="label">Solicitudes con match</span>
        </div>
      </div>

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
          <h3>Leads por categoría</h3>
          <ul>
            @for (item of leadsByCategory(); track item.name) {
              <li><span>{{ item.name }}</span><strong>{{ item.count }}</strong></li>
            }
          </ul>
        </div>
        <div class="breakdown">
          <h3>Leads por comuna</h3>
          <ul>
            @for (item of leadsByCommune(); track item.name) {
              <li><span>{{ item.name }}</span><strong>{{ item.count }}</strong></li>
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
        grid-template-columns: 1fr 1fr;
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
    `,
  ],
})
export class AdminOverviewComponent implements OnInit {
  /**
   * Límite alto para esta pantalla específicamente: los conteos superiores usan
   * `.total` (exacto, viene del backend sin importar la página), pero el desglose
   * "leads por categoría/comuna" y la tasa de match se calculan en el cliente sobre
   * `.data`, así que necesitan ver (casi) todos los registros. Para volúmenes grandes
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

  readonly leadsByCategory = computed(() => this.groupBy(this.leads(), (l) => l.serviceRequest?.category?.name));
  readonly leadsByCommune = computed(() => this.groupBy(this.leads(), (l) => l.serviceRequest?.commune?.name));

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

  private groupBy(leads: Lead[], keyFn: (lead: Lead) => string | undefined): Array<{ name: string; count: number }> {
    const map = new Map<string, number>();
    for (const lead of leads) {
      const key = keyFn(lead) ?? 'Sin categoría';
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }
}
