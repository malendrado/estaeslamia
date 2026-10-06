import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule, MatChipSelectionChange } from '@angular/material/chips';
import { MatExpansionModule } from '@angular/material/expansion';
import { forkJoin } from 'rxjs';
import { ProvidersService } from '../../core/services/providers.service';
import { CatalogService } from '../../core/services/catalog.service';
import { Category, Commune, Provider, ProviderStatus, Region, Service } from '../../core/models/models';
import { LoadingComponent } from '../../shared/components/loading/loading.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-provider-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatChipsModule,
    MatExpansionModule,
    LoadingComponent,
    StatusBadgeComponent,
  ],
  template: `
    @if (loading()) {
      <app-loading></app-loading>
    } @else {
      <div class="profile">
        <div class="status-row">
          <span>Estado de tu empresa:</span>
          <app-status-badge [status]="provider()!.status"></app-status-badge>
          @if (provider()!.status === ProviderStatus.PENDING) {
            <span class="hint">— un administrador debe aprobarla antes de que recibas leads.</span>
          }
        </div>

        <h3>Logo</h3>
        <div class="logo-section">
          @if (provider()!.logoUrl) {
            <img [src]="provider()!.logoUrl" alt="Logo de {{ provider()!.businessName }}" class="logo-preview" />
          } @else {
            <div class="logo-placeholder">Sin logo</div>
          }
          <div class="logo-actions">
            <input
              #logoInput
              type="file"
              accept="image/jpeg,image/png,image/webp,image/svg+xml"
              hidden
              (change)="onLogoSelected($event)"
            />
            <button mat-stroked-button type="button" (click)="logoInput.click()" [disabled]="uploadingLogo()">
              {{ uploadingLogo() ? 'Subiendo...' : provider()!.logoUrl ? 'Cambiar logo' : 'Subir logo' }}
            </button>
            <span class="logo-hint">JPG, PNG, WEBP o SVG · máx. 2 MB</span>
            @if (logoError()) {
              <span class="logo-error">{{ logoError() }}</span>
            }
          </div>
        </div>

        <h3>Datos de la empresa</h3>
        <form [formGroup]="profileForm" (ngSubmit)="saveProfile()" class="form-grid">
          <mat-form-field appearance="outline">
            <mat-label>Nombre comercial</mat-label>
            <input matInput formControlName="businessName" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Teléfono</mat-label>
            <input matInput formControlName="phone" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>WhatsApp</mat-label>
            <input matInput formControlName="whatsapp" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Sitio web</mat-label>
            <input matInput formControlName="website" />
          </mat-form-field>
          <mat-form-field appearance="outline" class="full">
            <mat-label>Descripción</mat-label>
            <textarea matInput rows="3" formControlName="description"></textarea>
          </mat-form-field>
          <button mat-flat-button color="primary" type="submit" [disabled]="profileForm.invalid || savingProfile()">
            {{ savingProfile() ? 'Guardando...' : 'Guardar datos' }}
          </button>
          @if (profileSaved()) {
            <span class="saved">Guardado ✓</span>
          }
        </form>

        <h3>Servicios que ofreces</h3>
        <mat-accordion multi class="chip-accordion">
          @for (cat of categories(); track cat.id) {
            <mat-expansion-panel>
              <mat-expansion-panel-header>
                <mat-panel-title>{{ cat.name }}</mat-panel-title>
                <mat-panel-description>
                  @if (selectedServicesCount(cat.id) > 0) {
                    {{ selectedServicesCount(cat.id) }} seleccionado{{ selectedServicesCount(cat.id) === 1 ? '' : 's' }}
                  }
                </mat-panel-description>
              </mat-expansion-panel-header>
              <mat-chip-listbox multiple [attr.aria-label]="'Servicios de ' + cat.name">
                @for (svc of servicesByCategory(cat.id); track svc.id) {
                  <mat-chip-option
                    [selected]="selectedServiceIds.has(svc.id)"
                    (selectionChange)="toggleService(svc.id, $event)"
                  >
                    {{ svc.name }}
                  </mat-chip-option>
                }
              </mat-chip-listbox>
            </mat-expansion-panel>
          }
        </mat-accordion>
        <button mat-flat-button color="primary" (click)="saveServices()" [disabled]="savingServices()">
          {{ savingServices() ? 'Guardando...' : 'Guardar servicios' }}
        </button>
        @if (servicesSaved()) {
          <span class="saved">Guardado ✓</span>
        }

        <h3>Comunas donde trabajas</h3>
        <mat-accordion multi class="chip-accordion">
          @for (region of regions(); track region.id) {
            <mat-expansion-panel>
              <mat-expansion-panel-header>
                <mat-panel-title>{{ region.name }}</mat-panel-title>
                <mat-panel-description>
                  @if (selectedCommunesCount(region.id) > 0) {
                    {{ selectedCommunesCount(region.id) }} seleccionada{{ selectedCommunesCount(region.id) === 1 ? '' : 's' }}
                  }
                </mat-panel-description>
              </mat-expansion-panel-header>
              <mat-chip-listbox multiple [attr.aria-label]="'Comunas de ' + region.name">
                @for (commune of communesByRegion(region.id); track commune.id) {
                  <mat-chip-option
                    [selected]="selectedCommuneIds.has(commune.id)"
                    (selectionChange)="toggleCommune(commune.id, $event)"
                  >
                    {{ commune.name }}
                  </mat-chip-option>
                }
              </mat-chip-listbox>
            </mat-expansion-panel>
          }
        </mat-accordion>
        <button mat-flat-button color="primary" (click)="saveCommunes()" [disabled]="savingCommunes()">
          {{ savingCommunes() ? 'Guardando...' : 'Guardar comunas' }}
        </button>
        @if (communesSaved()) {
          <span class="saved">Guardado ✓</span>
        }
      </div>
    }
  `,
  styles: [
    `
      .logo-section {
        display: flex;
        align-items: center;
        gap: 1.25rem;
        flex-wrap: wrap;
      }
      .logo-preview {
        width: 84px;
        height: 84px;
        border-radius: 12px;
        object-fit: cover;
        border: 1px solid #eee;
      }
      .logo-placeholder {
        width: 84px;
        height: 84px;
        border-radius: 12px;
        border: 1px dashed #ccc;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.72rem;
        color: #999;
      }
      .logo-actions {
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
        align-items: flex-start;
      }
      .logo-hint {
        font-size: 0.75rem;
        color: #999;
      }
      .logo-error {
        font-size: 0.78rem;
        color: #c62828;
      }
      .status-row {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 1.5rem;
      }
      .hint {
        color: #757575;
        font-size: 0.85rem;
      }
      h3 {
        margin-top: 2rem;
      }
      .form-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.5rem 1rem;
        align-items: start;
      }
      .form-grid mat-form-field {
        width: 100%;
        margin-bottom: 0;
      }
      .full {
        grid-column: 1 / -1;
      }
      .chip-accordion {
        display: block;
        margin-bottom: 1rem;
      }
      .chip-accordion mat-chip-listbox {
        padding: 0.25rem 0 0.75rem;
      }
      .saved {
        color: var(--eslm-primary);
        margin-left: 0.75rem;
        font-size: 0.85rem;
      }
    `,
  ],
})
export class ProviderProfileComponent implements OnInit {
  readonly ProviderStatus = ProviderStatus;
  readonly loading = signal(true);
  readonly provider = signal<Provider | null>(null);
  readonly categories = signal<Category[]>([]);
  readonly services = signal<Service[]>([]);
  readonly regions = signal<Region[]>([]);
  readonly communes = signal<Commune[]>([]);

  readonly uploadingLogo = signal(false);
  readonly logoError = signal<string | null>(null);

  readonly savingProfile = signal(false);
  readonly profileSaved = signal(false);
  readonly savingServices = signal(false);
  readonly servicesSaved = signal(false);
  readonly savingCommunes = signal(false);
  readonly communesSaved = signal(false);

  selectedServiceIds = new Set<string>();
  selectedCommuneIds = new Set<string>();

  private readonly fb = inject(FormBuilder);

  readonly profileForm = this.fb.group({
    businessName: ['', Validators.required],
    phone: ['', Validators.required],
    whatsapp: [''],
    website: [''],
    description: [''],
  });

  constructor(
    private readonly providersService: ProvidersService,
    private readonly catalogService: CatalogService,
  ) {}

  ngOnInit(): void {
    forkJoin({
      provider: this.providersService.getMyProfile(),
      categories: this.catalogService.getCategories(),
      services: this.catalogService.getServices(),
      regions: this.catalogService.getRegions(),
      communes: this.catalogService.getCommunes(),
    }).subscribe(({ provider, categories, services, regions, communes }) => {
      this.provider.set(provider);
      this.categories.set(categories);
      this.services.set(services);
      this.regions.set(regions);
      this.communes.set(communes);

      this.profileForm.patchValue({
        businessName: provider.businessName,
        phone: provider.phone,
        whatsapp: provider.whatsapp ?? '',
        website: provider.website ?? '',
        description: provider.description ?? '',
      });

      this.selectedServiceIds = new Set((provider.providerServices ?? []).map((p) => p.serviceId));
      this.selectedCommuneIds = new Set((provider.providerCommunes ?? []).map((p) => p.communeId));

      this.loading.set(false);
    });
  }

  servicesByCategory(categoryId: string): Service[] {
    return this.services().filter((s) => s.categoryId === categoryId);
  }

  selectedServicesCount(categoryId: string): number {
    return this.servicesByCategory(categoryId).filter((s) => this.selectedServiceIds.has(s.id)).length;
  }

  communesByRegion(regionId: string): Commune[] {
    return this.communes().filter((c) => c.regionId === regionId);
  }

  selectedCommunesCount(regionId: string): number {
    return this.communesByRegion(regionId).filter((c) => this.selectedCommuneIds.has(c.id)).length;
  }

  toggleService(serviceId: string, change: MatChipSelectionChange): void {
    change.selected ? this.selectedServiceIds.add(serviceId) : this.selectedServiceIds.delete(serviceId);
  }

  toggleCommune(communeId: string, change: MatChipSelectionChange): void {
    change.selected ? this.selectedCommuneIds.add(communeId) : this.selectedCommuneIds.delete(communeId);
  }

  onLogoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    // Validación en el cliente para dar feedback inmediato (el backend la repite igual, esto no es seguridad).
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      this.logoError.set('Solo se aceptan imágenes JPG, PNG, WEBP o SVG.');
      input.value = '';
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      this.logoError.set('La imagen supera los 2 MB.');
      input.value = '';
      return;
    }

    this.logoError.set(null);
    this.uploadingLogo.set(true);
    this.providersService.uploadLogo(file).subscribe({
      next: (updated) => {
        this.provider.set({ ...this.provider()!, logoUrl: updated.logoUrl });
        this.uploadingLogo.set(false);
        input.value = '';
      },
      error: (err) => {
        this.logoError.set(err?.error?.message ?? 'No pudimos subir el logo. Intenta nuevamente.');
        this.uploadingLogo.set(false);
        input.value = '';
      },
    });
  }

  saveProfile(): void {
    if (this.profileForm.invalid) return;
    this.savingProfile.set(true);
    this.profileSaved.set(false);
    this.providersService.updateMyProfile(this.profileForm.getRawValue() as Partial<Provider>).subscribe({
      next: () => {
        this.savingProfile.set(false);
        this.profileSaved.set(true);
      },
      error: () => this.savingProfile.set(false),
    });
  }

  saveServices(): void {
    this.savingServices.set(true);
    this.servicesSaved.set(false);
    this.providersService.setMyServices(Array.from(this.selectedServiceIds)).subscribe({
      next: () => {
        this.savingServices.set(false);
        this.servicesSaved.set(true);
      },
      error: () => this.savingServices.set(false),
    });
  }

  saveCommunes(): void {
    this.savingCommunes.set(true);
    this.communesSaved.set(false);
    this.providersService.setMyCommunes(Array.from(this.selectedCommuneIds)).subscribe({
      next: () => {
        this.savingCommunes.set(false);
        this.communesSaved.set(true);
      },
      error: () => this.savingCommunes.set(false),
    });
  }
}
