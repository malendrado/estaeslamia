import { ApplicationConfig, ErrorHandler, LOCALE_ID, provideZoneChangeDetection } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeEsCl from '@angular/common/locales/es-CL';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';
import * as Sentry from '@sentry/angular';
import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';

registerLocaleData(localeEsCl);

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    // Sin esto, Angular Router no toca el scroll al navegar — si venías de
    // abajo del todo en una página larga (ej. el FAQ de la home), la
    // siguiente página se queda scrolleada igual de abajo.
    provideRouter(routes, withInMemoryScrolling({ scrollPositionRestoration: 'top' })),
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
    // El datepicker (NativeDateAdapter) y el pipe `date` usan LOCALE_ID para
    // formato y nombres de mes/día — sin esto quedan en inglés/formato EE.UU.
    // (10/15/2026 en vez de 15-10-2026).
    { provide: LOCALE_ID, useValue: 'es-CL' },
  ],
};
