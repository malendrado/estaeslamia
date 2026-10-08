import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Provider } from '../providers/entities/provider.entity';
import { ServiceRequest } from '../service-requests/entities/service-request.entity';
import { ProviderStatus, ServiceRequestStatus } from '../../common/enums';

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
    @InjectRepository(ServiceRequest)
    private readonly serviceRequestRepository: Repository<ServiceRequest>,
  ) {}

  async findCompatibleProviders(serviceId: string, communeId: string): Promise<Provider[]> {
    return this.providerRepository
      .createQueryBuilder('provider')
      .innerJoin('provider.providerServices', 'ps', 'ps.serviceId = :serviceId', { serviceId })
      .innerJoin('provider.providerCommunes', 'pc', 'pc.communeId = :communeId', { communeId })
      .where('provider.status = :status', { status: ProviderStatus.ACTIVE })
      .getMany();
  }

  /**
   * Dirección inversa del matching: un provider que recién pasó a ACTIVE o
   * actualizó sus servicios/comunas puede calificar para solicitudes SUBMITTED
   * que ya existían y quedaron sin match (el matching solo corre una vez, al
   * crear la solicitud — ver ServiceRequestsService.create).
   */
  async findPendingServiceRequestsForProvider(providerId: string): Promise<ServiceRequest[]> {
    return this.serviceRequestRepository
      .createQueryBuilder('sr')
      .leftJoinAndSelect('sr.service', 'service')
      .leftJoinAndSelect('sr.commune', 'commune')
      .innerJoin('provider_services', 'ps', 'ps.service_id = sr.service_id AND ps.provider_id = :providerId', {
        providerId,
      })
      .innerJoin('provider_communes', 'pc', 'pc.commune_id = sr.commune_id AND pc.provider_id = :providerId', {
        providerId,
      })
      .where('sr.status = :status', { status: ServiceRequestStatus.SUBMITTED })
      .getMany();
  }
}
