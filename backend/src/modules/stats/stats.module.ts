import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from '../categories/entities/category.entity';
import { Service } from '../services/entities/service.entity';
import { Provider } from '../providers/entities/provider.entity';
import { ProviderCommune } from '../providers/entities/provider-commune.entity';
import { StatsController } from './stats.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Category, Service, Provider, ProviderCommune])],
  controllers: [StatsController],
})
export class StatsModule {}
