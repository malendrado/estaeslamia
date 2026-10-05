import { Module } from '@nestjs/common';
import { ServicesModule } from '../services/services.module';
import { SitemapController } from './sitemap.controller';

@Module({
  imports: [ServicesModule],
  controllers: [SitemapController],
})
export class SitemapModule {}
