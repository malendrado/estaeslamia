import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lead } from './entities/lead.entity';
import { Provider } from '../providers/entities/provider.entity';
import { ServiceRequest } from '../service-requests/entities/service-request.entity';
import { MatchingService } from './matching.service';
import { LeadStatus, LEAD_VALID_TRANSITIONS } from '../../common/enums';
import { PaginatedResult, paginate } from '../../common/types/paginated-result.type';

@Injectable()
export class LeadsService {
  constructor(
    @InjectRepository(Lead)
    private readonly leadRepository: Repository<Lead>,
    @InjectRepository(Provider)
    private readonly providerRepository: Repository<Provider>,
    private readonly matchingService: MatchingService,
  ) {}

  /**
   * Ejecuta el matching para una ServiceRequest recién creada y genera un Lead
   * por cada provider compatible. Se marca DELIVERED de inmediato (Fase MVP:
   * sin cola de entrega, se "entrega" en el mismo request).
   */
  async generateLeadsForServiceRequest(serviceRequest: ServiceRequest): Promise<Lead[]> {
    const compatibleProviders = await this.matchingService.findCompatibleProviders(
      serviceRequest.serviceId,
      serviceRequest.communeId,
    );

    if (compatibleProviders.length === 0) {
      return [];
    }

    const leads = compatibleProviders.map((provider) =>
      this.leadRepository.create({
        serviceRequestId: serviceRequest.id,
        providerId: provider.id,
        status: LeadStatus.DELIVERED,
        price: 0,
        isPaid: false,
      }),
    );

    return this.leadRepository.save(leads);
  }

  async findByServiceRequestId(serviceRequestId: string): Promise<Lead[]> {
    return this.leadRepository.find({
      where: { serviceRequestId },
      relations: { provider: true },
      order: { createdAt: 'ASC' },
    });
  }

  private async resolveProviderId(userId: string): Promise<string> {
    const provider = await this.providerRepository.findOne({ where: { userId } });
    if (!provider) throw new NotFoundException('Perfil de empresa no encontrado para este usuario');
    return provider.id;
  }

  async findMineForProvider(userId: string, status?: LeadStatus): Promise<Lead[]> {
    const providerId = await this.resolveProviderId(userId);
    return this.leadRepository.find({
      where: { providerId, ...(status ? { status } : {}) },
      relations: { serviceRequest: { service: true, commune: true, category: true } },
      order: { createdAt: 'DESC' },
    });
  }

  async findOneForProvider(userId: string, leadId: string): Promise<Lead> {
    const providerId = await this.resolveProviderId(userId);
    const lead = await this.leadRepository.findOne({
      where: { id: leadId },
      relations: { serviceRequest: { service: true, commune: true, category: true } },
    });
    if (!lead) throw new NotFoundException('Lead no encontrado');
    if (lead.providerId !== providerId) {
      throw new ForbiddenException('Este lead no pertenece a tu empresa');
    }
    // Primera vista: transición implícita DELIVERED -> VIEWED
    if (lead.status === LeadStatus.DELIVERED) {
      lead.status = LeadStatus.VIEWED;
      await this.leadRepository.save(lead);
    }
    return lead;
  }

  async updateStatusForProvider(userId: string, leadId: string, nextStatus: LeadStatus): Promise<Lead> {
    const providerId = await this.resolveProviderId(userId);
    const lead = await this.leadRepository.findOne({ where: { id: leadId } });
    if (!lead) throw new NotFoundException('Lead no encontrado');
    if (lead.providerId !== providerId) {
      throw new ForbiddenException('Este lead no pertenece a tu empresa');
    }

    const allowed = LEAD_VALID_TRANSITIONS[lead.status];
    if (!allowed.includes(nextStatus)) {
      throw new ForbiddenException(`No se puede pasar de ${lead.status} a ${nextStatus}`);
    }

    lead.status = nextStatus;
    if (nextStatus === LeadStatus.CONTACTED) {
      lead.contactedAt = new Date();
    }
    return this.leadRepository.save(lead);
  }

  async findAllForAdmin(filters: {
    status?: LeadStatus;
    providerId?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResult<Lead>> {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;

    const [data, total] = await this.leadRepository.findAndCount({
      where: {
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.providerId ? { providerId: filters.providerId } : {}),
      },
      relations: { provider: true, serviceRequest: { service: true, commune: true, category: true } },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return paginate(data, total, page, limit);
  }
}
