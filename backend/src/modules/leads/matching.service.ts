import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Provider } from '../providers/entities/provider.entity';
import { ProviderStatus } from '../../common/enums';

/**
 * Matching Engine MVP — sin IA, sin distancia/rating/precio (eso queda para
 * una fase posterior, ver Fase 0 sección "Matching MVP").
 *
 * Regla única: provider ACTIVE que ofrece el serviceId Y trabaja en el communeId.
 */
@Injectable()
export class MatchingService {
  constructor(
    @InjectRepository(Provider)
    private readonly providerRepository: Repository<Provider>,
  ) {}

  async findCompatibleProviders(serviceId: string, communeId: string): Promise<Provider[]> {
    return this.providerRepository
      .createQueryBuilder('provider')
      .innerJoin('provider.providerServices', 'ps', 'ps.serviceId = :serviceId', { serviceId })
      .innerJoin('provider.providerCommunes', 'pc', 'pc.communeId = :communeId', { communeId })
      .where('provider.status = :status', { status: ProviderStatus.ACTIVE })
      .getMany();
  }
}
