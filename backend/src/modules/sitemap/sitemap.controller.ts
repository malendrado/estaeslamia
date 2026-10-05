import { Controller, Get, Header } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { ServicesService } from '../services/services.service';

const SITE_URL = 'https://estaeslamia.cl';

@ApiExcludeController() // no tiene sentido documentarlo en Swagger, no es parte de la API funcional
@Controller()
export class SitemapController {
  constructor(private readonly servicesService: ServicesService) {}

  @Get('sitemap.xml')
  @Header('Content-Type', 'application/xml')
  async getSitemap(): Promise<string> {
    const services = await this.servicesService.findAllActive();

    const staticUrls = [
      { loc: `${SITE_URL}/`, priority: '1.0' },
      { loc: `${SITE_URL}/solicitar`, priority: '0.9' },
    ];

    const serviceUrls = services.map((service) => ({
      loc: `${SITE_URL}/servicios/${service.slug}`,
      priority: '0.8',
    }));

    const urls = [...staticUrls, ...serviceUrls]
      .map((u) => `  <url>\n    <loc>${u.loc}</loc>\n    <priority>${u.priority}</priority>\n  </url>`)
      .join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;
  }
}
