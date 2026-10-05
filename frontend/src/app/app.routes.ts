import { Routes } from '@angular/router';
import { roleGuard } from './core/guards/role.guard';
import { UserRole } from './core/models/models';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./home/home.component').then((m) => m.HomeComponent),
    title: 'EstaEsLaMía.cl — Encuentra a quien puede ayudarte',
  },

  // ---- Flujo público de solicitud ----
  {
    path: 'solicitar',
    loadComponent: () =>
      import('./service-request/wizard/service-request-wizard.component').then((m) => m.ServiceRequestWizardComponent),
    title: 'Solicitar un servicio — EstaEsLaMía.cl',
  },
  {
    path: 'solicitud/:id',
    loadComponent: () =>
      import('./service-request/confirmation/service-request-confirmation.component').then(
        (m) => m.ServiceRequestConfirmationComponent,
      ),
    title: 'Solicitud enviada — EstaEsLaMía.cl',
  },
  {
    path: 'servicios/:slug',
    loadComponent: () => import('./service-landing/service-landing.component').then((m) => m.ServiceLandingComponent),
  },

  // ---- Legal ----
  {
    path: 'terminos',
    loadComponent: () => import('./legal/terms/terms.component').then((m) => m.TermsComponent),
  },
  {
    path: 'privacidad',
    loadComponent: () => import('./legal/privacy/privacy.component').then((m) => m.PrivacyComponent),
  },

  // ---- Auth ----
  {
    path: 'login',
    loadComponent: () => import('./auth/login/login.component').then((m) => m.LoginComponent),
    title: 'Iniciar sesión — EstaEsLaMía.cl',
  },
  {
    path: 'registro',
    loadComponent: () => import('./auth/register/register.component').then((m) => m.RegisterComponent),
    title: 'Crear cuenta — EstaEsLaMía.cl',
  },
  {
    path: 'proveedores/registro',
    loadComponent: () =>
      import('./auth/register-provider/register-provider.component').then((m) => m.RegisterProviderComponent),
    title: 'Registra tu empresa — EstaEsLaMía.cl',
  },

  // ---- Dashboard Customer ----
  {
    path: 'mis-solicitudes',
    canActivate: [roleGuard],
    data: { roles: [UserRole.CUSTOMER] },
    loadComponent: () => import('./customer/my-requests/my-requests.component').then((m) => m.MyRequestsComponent),
    title: 'Mis solicitudes — EstaEsLaMía.cl',
  },
  {
    path: 'mis-solicitudes/:id',
    canActivate: [roleGuard],
    data: { roles: [UserRole.CUSTOMER] },
    loadComponent: () => import('./customer/request-detail/request-detail.component').then((m) => m.RequestDetailComponent),
    title: 'Detalle de solicitud — EstaEsLaMía.cl',
  },

  // ---- Dashboard Provider ----
  {
    path: 'proveedor',
    canActivate: [roleGuard],
    data: { roles: [UserRole.PROVIDER] },
    loadComponent: () => import('./provider/provider-layout/provider-layout.component').then((m) => m.ProviderLayoutComponent),
    children: [
      {
        path: '',
        loadComponent: () => import('./provider/leads-list/leads-list.component').then((m) => m.ProviderLeadsListComponent),
        title: 'Mis leads — EstaEsLaMía.cl',
      },
      {
        path: 'leads/:id',
        loadComponent: () => import('./provider/lead-detail/lead-detail.component').then((m) => m.ProviderLeadDetailComponent),
        title: 'Detalle de lead — EstaEsLaMía.cl',
      },
      {
        path: 'perfil',
        loadComponent: () => import('./provider/profile/provider-profile.component').then((m) => m.ProviderProfileComponent),
        title: 'Mi perfil — EstaEsLaMía.cl',
      },
    ],
  },

  // ---- Dashboard Admin ----
  {
    path: 'admin',
    canActivate: [roleGuard],
    data: { roles: [UserRole.ADMIN] },
    loadComponent: () => import('./admin/admin-layout/admin-layout.component').then((m) => m.AdminLayoutComponent),
    children: [
      {
        path: '',
        loadComponent: () => import('./admin/overview/overview.component').then((m) => m.AdminOverviewComponent),
        title: 'Resumen — Admin EstaEsLaMía.cl',
      },
      {
        path: 'solicitudes',
        loadComponent: () =>
          import('./admin/service-requests/admin-service-requests.component').then((m) => m.AdminServiceRequestsComponent),
        title: 'Solicitudes — Admin EstaEsLaMía.cl',
      },
      {
        path: 'leads',
        loadComponent: () => import('./admin/leads/admin-leads.component').then((m) => m.AdminLeadsComponent),
        title: 'Leads — Admin EstaEsLaMía.cl',
      },
      {
        path: 'providers',
        loadComponent: () => import('./admin/providers/admin-providers.component').then((m) => m.AdminProvidersComponent),
        title: 'Empresas — Admin EstaEsLaMía.cl',
      },
      {
        path: 'categorias',
        loadComponent: () => import('./admin/categories/admin-categories.component').then((m) => m.AdminCategoriesComponent),
        title: 'Categorías — Admin EstaEsLaMía.cl',
      },
      {
        path: 'usuarios',
        loadComponent: () => import('./admin/users/admin-users.component').then((m) => m.AdminUsersComponent),
        title: 'Usuarios — Admin EstaEsLaMía.cl',
      },
    ],
  },

  { path: '**', redirectTo: '' },
];
