import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

const SITE_NAME = 'EstaEsLaMía.cl';
const DEFAULT_DESCRIPTION = 'Cuéntanos qué necesitas y conecta con empresas y profesionales que pueden hacerlo.';
const SITE_URL = 'https://estaeslamia.cl';
const DEFAULT_IMAGE = `${SITE_URL}/assets/og-cover.png`;

export interface SeoData {
  title: string;
  description?: string;
  path?: string;
  image?: string;
  noindex?: boolean;
}

/**
 * Servicio central de SEO/meta tags. Nota: esta app es una SPA sin SSR
 * (decisión de Fase 0 para mantener el MVP simple), así que esto mejora
 * el título de pestaña, las previews al compartir (Open Graph) y deja la
 * estructura lista para migrar a Angular Universal más adelante — pero
 * no reemplaza el SSR para indexación orgánica real en buscadores.
 */
@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly titleService = inject(Title);
  private readonly meta = inject(Meta);

  set(data: SeoData): void {
    const fullTitle = `${data.title} — ${SITE_NAME}`;
    const description = data.description ?? DEFAULT_DESCRIPTION;
    const url = data.path ? `${SITE_URL}${data.path}` : SITE_URL;
    const image = data.image ?? DEFAULT_IMAGE;

    this.titleService.setTitle(fullTitle);

    this.setTag('name', 'description', description);
    this.setTag('property', 'og:title', fullTitle);
    this.setTag('property', 'og:description', description);
    this.setTag('property', 'og:type', 'website');
    this.setTag('property', 'og:url', url);
    this.setTag('property', 'og:image', image);
    this.setTag('property', 'og:site_name', SITE_NAME);
    this.setTag('name', 'twitter:card', 'summary_large_image');
    this.setTag('name', 'twitter:title', fullTitle);
    this.setTag('name', 'twitter:description', description);
    this.setTag('name', 'robots', data.noindex ? 'noindex, nofollow' : 'index, follow');

    this.setCanonical(url);
  }

  private setTag(attr: 'name' | 'property', key: string, content: string): void {
    this.meta.updateTag({ [attr]: key, content });
  }

  private setCanonical(url: string): void {
    let link: HTMLLinkElement | null = document.querySelector('link[rel="canonical"]');
    if (!link) {
      link = document.createElement('link');
      link.setAttribute('rel', 'canonical');
      document.head.appendChild(link);
    }
    link.setAttribute('href', url);
  }
}
