import { Controller, Get } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Category } from '../categories/entities/category.entity';
import { Service } from '../services/entities/service.entity';
import { Provider } from '../providers/entities/provider.entity';
import { ProviderCommune } from '../providers/entities/provider-commune.entity';
import { ProviderStatus } from '../../common/enums';

export interface PublicStats {
  categoriesCount: number;
  servicesCount: number;
  activeProvidersCount: number;
  communesCoveredCount: number;
}

@ApiTags('stats')
@Controller('stats')
export class StatsController {
  constructor(
    @InjectRepository(Category) private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Service) private readonly serviceRepository: Repository<Service>,
    @InjectRepository(Provider) private readonly providerRepository: Repository<Provider>,
    @InjectRepository(ProviderCommune) private readonly providerCommuneRepository: Repository<ProviderCommune>,
  ) {}

  @Get('public')
  @ApiOperation({ summary: 'Cifras públicas agregadas para la landing (categorías, servicios, empresas activas, comunas con cobertura)' })
  async getPublicStats(): Promise<PublicStats> {
    const [categoriesCount, servicesCount, activeProvidersCount, communesCoveredCount] = await Promise.all([
      this.categoryRepository.count({ where: { isActive: true } }),
      this.serviceRepository.count({ where: { isActive: true } }),
      this.providerRepository.count({ where: { status: ProviderStatus.ACTIVE } }),
      this.providerCommuneRepository
        .createQueryBuilder('pc')
        .innerJoin('pc.provider', 'provider', 'provider.status = :status', { status: ProviderStatus.ACTIVE })
        .select('COUNT(DISTINCT pc.communeId)', 'count')
        .getRawOne()
        .then((row) => parseInt(row.count, 10)),
    ]);

    return { categoriesCount, servicesCount, activeProvidersCount, communesCoveredCount };
  }
}
