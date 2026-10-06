import { ApplicationConfig, ErrorHandler, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';
import * as Sentry from '@sentry/angular';
import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimations(),
    provideHttpClient(withInterceptors([authInterceptor])),
    // Reemplaza el ErrorHandler por defecto de Angular: reporta errores no capturados
    // a Sentry. Sin environment.sentryDsn configurado, es un no-op seguro.
    { provide: ErrorHandler, useValue: Sentry.createErrorHandler() },
    // subscriptSizing dynamic: el form-field solo reserva espacio para el
    // hint/error cuando realmente se muestra, en vez de dejar ~22px fijos
    // siempre — así el campo no se ve desproporcionadamente alto al lado
    // de un botón (ej. "Agregar" en los formularios inline de admin).
    { provide: MAT_FORM_FIELD_DEFAULT_OPTIONS, useValue: { subscriptSizing: 'dynamic' } },
  ],
};
