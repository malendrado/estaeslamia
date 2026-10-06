import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatStepperModule } from '@angular/material/stepper';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { CatalogService } from '../../core/services/catalog.service';
import { ServiceRequestsService } from '../../core/services/service-requests.service';
import { SeoService } from '../../core/services/seo.service';
import { AnalyticsService } from '../../core/services/analytics.service';
import { Category, Commune, Region, Service } from '../../core/models/models';
import { TurnstileComponent } from '../../shared/components/turnstile/turnstile.component';
import { environment } from '../../../environments/environment';

const budgetRangeValidator: ValidatorFn = (group: AbstractControl): ValidationErrors | null => {
  const min = group.get('budgetMin')?.value;
  const max = group.get('budgetMax')?.value;
  if (min == null || max == null) return null;
  return max < min ? { budgetRange: true } : null;
};

@Component({
  selector: 'app-service-request-wizard',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatStepperModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatCheckboxModule,
    TurnstileComponent,
  ],
  template: `
    <div class="wizard-page">
      <h1>Cuéntanos qué necesitas</h1>
      <p class="subtitle">Toma menos de 2 minutos. No necesitas crear una cuenta.</p>

      <mat-stepper linear #stepper class="stepper">
        <mat-step [stepControl]="serviceGroup" label="Servicio">
          <form [formGroup]="serviceGroup" class="step-form">
            <mat-form-field appearance="outline" class="full">
              <mat-label>Categoría</mat-label>
              <mat-select formControlName="categoryId" (selectionChange)="onCategoryChange($event.value)">
                @for (cat of categories(); track cat.id) {
                  <mat-option [value]="cat.id">{{ cat.name }}</mat-option>
                }
              </mat-select>
              @if (serviceGroup.get('categoryId')?.invalid && serviceGroup.get('categoryId')?.touched) {
                <mat-error>Selecciona una categoría</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="full">
              <mat-label>Servicio</mat-label>
              <mat-select formControlName="serviceId">
                @for (svc of services(); track svc.id) {
                  <mat-option [value]="svc.id">{{ svc.name }}</mat-option>
                }
              </mat-select>
              @if (serviceGroup.get('serviceId')?.invalid && serviceGroup.get('serviceId')?.touched) {
                <mat-error>Selecciona un servicio</mat-error>
              }
            </mat-form-field>

            <button mat-flat-button color="primary" matStepperNext type="button" [disabled]="serviceGroup.invalid">
              Continuar
            </button>
          </form>
        </mat-step>

        <mat-step [stepControl]="locationGroup" label="Ubicación">
          <form [formGroup]="locationGroup" class="step-form">
            <mat-form-field appearance="outline" class="full">
              <mat-label>Región</mat-label>
              <mat-select formControlName="regionId" (selectionChange)="onRegionChange($event.value)">
                @for (region of regions(); track region.id) {
                  <mat-option [value]="region.id">{{ region.name }}</mat-option>
                }
              </mat-select>
              @if (locationGroup.get('regionId')?.invalid && locationGroup.get('regionId')?.touched) {
                <mat-error>Selecciona una región</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="full">
              <mat-label>Comuna</mat-label>
              <mat-select formControlName="communeId">
                @for (commune of communes(); track commune.id) {
                  <mat-option [value]="commune.id">{{ commune.name }}</mat-option>
                }
              </mat-select>
              @if (locationGroup.get('communeId')?.invalid && locationGroup.get('communeId')?.touched) {
                <mat-error>Selecciona una comuna</mat-error>
              }
            </mat-form-field>

            <div class="actions">
              <button mat-button matStepperPrevious type="button">Atrás</button>
              <button mat-flat-button color="primary" matStepperNext type="button" [disabled]="locationGroup.invalid">
                Continuar
              </button>
            </div>
          </form>
        </mat-step>

        <mat-step [stepControl]="detailGroup" label="Detalle">
          <form [formGroup]="detailGroup" class="step-form">
            <mat-form-field appearance="outline" class="full">
              <mat-label>Describe lo que necesitas</mat-label>
              <textarea matInput formControlName="description" rows="4" placeholder="Ej: Necesito instalar 2 equipos de aire acondicionado en dormitorios"></textarea>
              <mat-hint align="end">Mínimo 10 caracteres</mat-hint>
              @if (detailGroup.get('description')?.touched) {
                @if (detailGroup.get('description')?.hasError('required')) {
                  <mat-error>Cuéntanos brevemente qué necesitas</mat-error>
                } @else if (detailGroup.get('description')?.hasError('minlength')) {
                  <mat-error>Necesitamos un poco más de detalle (mínimo 10 caracteres)</mat-error>
                }
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="full">
              <mat-label>Dirección (opcional)</mat-label>
              <input matInput formControlName="address" />
            </mat-form-field>

            <mat-form-field appearance="outline" class="half">
              <mat-label>Fecha aproximada (opcional)</mat-label>
              <input matInput type="date" formControlName="preferredDate" [min]="minDate" />
            </mat-form-field>

            <div class="budget-row">
              <mat-form-field appearance="outline" class="half">
                <mat-label>Presupuesto mín. (opcional)</mat-label>
                <input matInput type="number" min="0" formControlName="budgetMin" />
              </mat-form-field>
              <mat-form-field appearance="outline" class="half">
                <mat-label>Presupuesto máx. (opcional)</mat-label>
                <input matInput type="number" min="0" formControlName="budgetMax" />
              </mat-form-field>
            </div>
            @if (detailGroup.hasError('budgetRange') && detailGroup.get('budgetMax')?.touched) {
              <p class="field-error" role="alert">El presupuesto máximo debe ser mayor o igual al mínimo.</p>
            }

            <div class="actions">
              <button mat-button matStepperPrevious type="button">Atrás</button>
              <button mat-flat-button color="primary" matStepperNext type="button" [disabled]="detailGroup.invalid">
                Continuar
              </button>
            </div>
          </form>
        </mat-step>

        <mat-step [stepControl]="contactGroup" label="Contacto">
          <form [formGroup]="contactGroup" class="step-form" (ngSubmit)="submit()">
            <mat-form-field appearance="outline" class="full">
              <mat-label>Nombre</mat-label>
              <input matInput formControlName="contactName" />
              @if (contactGroup.get('contactName')?.invalid && contactGroup.get('contactName')?.touched) {
                <mat-error>Ingresa tu nombre</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="full">
              <mat-label>Email</mat-label>
              <input matInput type="email" formControlName="contactEmail" />
              @if (contactGroup.get('contactEmail')?.touched) {
                @if (contactGroup.get('contactEmail')?.hasError('required')) {
                  <mat-error>Ingresa tu email</mat-error>
                } @else if (contactGroup.get('contactEmail')?.hasError('email')) {
                  <mat-error>Ingresa un email válido</mat-error>
                }
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="full">
              <mat-label>Teléfono</mat-label>
              <input matInput formControlName="contactPhone" />
              @if (contactGroup.get('contactPhone')?.invalid && contactGroup.get('contactPhone')?.touched) {
                <mat-error>Ingresa tu teléfono</mat-error>
              }
            </mat-form-field>

            <mat-checkbox formControlName="consentAccepted">
              Acepto que mis datos sean compartidos con empresas que puedan ofrecerme este servicio, según la
              <a routerLink="/privacidad" target="_blank" (click)="$event.stopPropagation()">Política de Privacidad</a>.
            </mat-checkbox>
            @if (contactGroup.get('consentAccepted')?.invalid && contactGroup.get('consentAccepted')?.dirty) {
              <p class="field-error" role="alert">Debes aceptar la política de privacidad para continuar.</p>
            }

            <app-turnstile (verified)="turnstileToken = $event" (expired)="turnstileToken = ''"></app-turnstile>

            @if (errorMessage()) {
              <p class="error" role="alert">{{ errorMessage() }}</p>
            }

            <div class="actions">
              <button mat-button matStepperPrevious type="button">Atrás</button>
              <button
                mat-flat-button
                color="primary"
                type="submit"
                [disabled]="contactGroup.invalid || submitting() || (turnstileRequired && !turnstileToken)"
              >
                {{ submitting() ? 'Enviando...' : 'Enviar solicitud' }}
              </button>
            </div>
          </form>
        </mat-step>
      </mat-stepper>
    </div>
  `,
  styles: [
    `
      .wizard-page {
        max-width: 640px;
        margin: 0 auto;
        padding: 2rem 1rem 4rem;
      }
      .subtitle {
        color: #757575;
        margin-bottom: 1.5rem;
      }
      /* Tarjeta: el stepper de Material no trae sombra/bordes redondeados por
         defecto, se ve como un rectángulo plano pegado al fondo. */
      .stepper {
        border-radius: 20px !important;
        box-shadow: 0 16px 32px -16px rgba(22, 33, 62, 0.18) !important;
        padding: 0.5rem 1.5rem 1.5rem !important;
      }
      ::ng-deep .stepper .mat-horizontal-stepper-header-container {
        padding: 0.5rem 0 1rem;
      }
      /* Los labels de cada paso se truncaban con "..." en el ancho angosto
         del wizard (ej. "Servi...", "Ubicac..."): se dejan envolver en vez
         de cortarse. */
      ::ng-deep .stepper .mat-step-label,
      ::ng-deep .stepper .mat-step-text-label {
        max-width: none !important;
        overflow: visible !important;
        white-space: normal !important;
        text-overflow: clip !important;
        font-size: 0.85rem;
      }
      ::ng-deep .stepper .mat-horizontal-stepper-header {
        height: auto !important;
        padding: 0.75rem 0.5rem !important;
      }
      /* Botones a pastilla, igual que el resto del sitio (en vez del
         rectángulo cuadrado por defecto de Material). */
      ::ng-deep .stepper .mat-mdc-button-base {
        border-radius: 999px !important;
        padding-left: 1.3rem !important;
        padding-right: 1.3rem !important;
      }
      ::ng-deep .stepper .mdc-notched-outline__leading {
        border-radius: 10px 0 0 10px !important;
      }
      ::ng-deep .stepper .mdc-notched-outline__trailing {
        border-radius: 0 10px 10px 0 !important;
      }
      .step-form {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        padding-top: 1rem;
      }
      .step-form mat-form-field {
        margin-bottom: 0;
      }
      .full {
        width: 100%;
      }
      .half {
        width: 100%;
      }
      .budget-row {
        display: flex;
        gap: 1rem;
      }
      .budget-row .half {
        flex: 1;
      }
      .actions {
        display: flex;
        justify-content: space-between;
        margin-top: 0.5rem;
      }
      .error,
      .field-error {
        color: #c62828;
        font-size: 0.85rem;
      }
    `,
  ],
})
export class ServiceRequestWizardComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  readonly minDate = new Date().toISOString().slice(0, 10);

  readonly categories = signal<Category[]>([]);
  readonly services = signal<Service[]>([]);
  readonly regions = signal<Region[]>([]);
  readonly communes = signal<Commune[]>([]);
  readonly submitting = signal(false);
  turnstileToken = '';
  readonly turnstileRequired = !!environment.turnstileSiteKey;
  readonly errorMessage = signal<string | null>(null);

  readonly serviceGroup = this.fb.group({
    categoryId: ['', Validators.required],
    serviceId: ['', Validators.required],
  });

  readonly locationGroup = this.fb.group({
    regionId: ['', Validators.required],
    communeId: ['', Validators.required],
  });

  readonly detailGroup = this.fb.group(
    {
      description: ['', [Validators.required, Validators.minLength(10)]],
      address: [''],
      preferredDate: [''],
      budgetMin: [null as number | null],
      budgetMax: [null as number | null],
    },
    { validators: budgetRangeValidator },
  );

  readonly contactGroup = this.fb.group({
    contactName: ['', Validators.required],
    contactEmail: ['', [Validators.required, Validators.email]],
    contactPhone: ['', Validators.required],
    consentAccepted: [false, Validators.requiredTrue],
  });

  constructor(
    private readonly catalogService: CatalogService,
    private readonly serviceRequestsService: ServiceRequestsService,
    private readonly seoService: SeoService,
    private readonly analyticsService: AnalyticsService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.seoService.set({
      title: 'Solicitar un servicio',
      description: 'Cuéntanos qué necesitas: categoría, servicio, comuna y descripción. Toma menos de 2 minutos.',
      path: '/solicitar',
    });
    this.analyticsService.track('WIZARD_STARTED', '/solicitar');

    this.catalogService.getCategories().subscribe((cats) => this.categories.set(cats));
    this.catalogService.getRegions().subscribe((regions) => this.regions.set(regions));

    // Prellenado opcional cuando se llega desde una landing de servicio (/servicios/:slug)
    const { categoryId, serviceId } = this.route.snapshot.queryParams;
    if (categoryId) {
      this.serviceGroup.patchValue({ categoryId });
      this.catalogService.getServices(categoryId).subscribe((services) => {
        this.services.set(services);
        if (serviceId) {
          this.serviceGroup.patchValue({ serviceId });
        }
      });
    }
  }

  onCategoryChange(categoryId: string): void {
    this.serviceGroup.patchValue({ serviceId: '' });
    this.catalogService.getServices(categoryId).subscribe((services) => this.services.set(services));
  }

  onRegionChange(regionId: string): void {
    this.locationGroup.patchValue({ communeId: '' });
    this.catalogService.getCommunes(regionId).subscribe((communes) => this.communes.set(communes));
  }

  submit(): void {
    if (this.serviceGroup.invalid || this.locationGroup.invalid || this.detailGroup.invalid || this.contactGroup.invalid) {
      return;
    }
    this.submitting.set(true);
    this.errorMessage.set(null);

    const payload = {
      ...this.serviceGroup.getRawValue(),
      ...this.locationGroup.getRawValue(),
      ...this.detailGroup.getRawValue(),
      ...this.contactGroup.getRawValue(),
      turnstileToken: this.turnstileToken,
    } as any;

    // Angular envía null en campos numéricos vacíos; el backend espera que no vengan si no hay valor.
    if (payload.budgetMin === null) delete payload.budgetMin;
    if (payload.budgetMax === null) delete payload.budgetMax;
    if (!payload.address) delete payload.address;
    if (!payload.preferredDate) delete payload.preferredDate;

    this.serviceRequestsService.create(payload).subscribe({
      next: (result) => {
        this.submitting.set(false);
        this.analyticsService.track('SERVICE_REQUEST_CREATED', '/solicitar');
        this.router.navigate(['/solicitud', result.id]);
      },
      error: (err) => {
        this.submitting.set(false);
        this.errorMessage.set(err?.error?.message ?? 'No pudimos enviar tu solicitud. Intenta nuevamente.');
      },
    });
  }
}
