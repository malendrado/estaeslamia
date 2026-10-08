import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, Repository } from 'typeorm';
import { Lead } from './entities/lead.entity';
import { Provider } from '../providers/entities/provider.entity';
import { ServiceRequest } from '../service-requests/entities/service-request.entity';
import { MatchingService } from './matching.service';
import { LeadStatus, LEAD_VALID_TRANSITIONS, ServiceRequestStatus } from '../../common/enums';
import { PaginatedResult, paginate } from '../../common/types/paginated-result.type';
import { EmailService } from '../../common/services/email.service';

// Cualquier estado que no sea terminal (REJECTED/CONVERTED/EXPIRED) — un lead
// "en curso" del que el cliente puede estar esperando novedades.
const ACTIVE_LEAD_STATUSES = [
  LeadStatus.GENERATED,
  LeadStatus.DELIVERED,
  LeadStatus.VIEWED,
  LeadStatus.ACCEPTED,
  LeadStatus.CONTACTED,
];

@Injectable()
export class LeadsService {
  constructor(
    @InjectRepository(Lead)
    private readonly leadRepository: Repository<Lead>,
    @InjectRepository(Provider)
    private readonly providerRepository: Repository<Provider>,
    @InjectRepository(ServiceRequest)
    private readonly serviceRequestRepository: Repository<ServiceRequest>,
    private readonly matchingService: MatchingService,
    private readonly emailService: EmailService,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Ejecuta el matching para una ServiceRequest recién creada y genera un Lead
   * por cada provider compatible. Se marca DELIVERED de inmediato (Fase MVP:
   * sin cola de entrega, se "entrega" en el mismo request).
   *
   * Recibe el `manager` de la transacción abierta por ServiceRequestsService.create()
   * — la creación de la ServiceRequest y la de sus Leads son una sola unidad: si el
   * matching falla a mitad de camino, no debe quedar una solicitud sin sus leads
   * correspondientes. No manda emails acá: eso pasa después del commit, vía
   * notifyNewMatch, para no tener una llamada HTTP externa colgando de una
   * transacción de base de datos todavía abierta.
   */
  async generateLeadsInTransaction(
    serviceRequest: ServiceRequest,
    manager: EntityManager,
  ): Promise<{ leads: Lead[]; compatibleProviders: Provider[] }> {
    const compatibleProviders = await this.matchingService.findCompatibleProviders(
      serviceRequest.serviceId,
      serviceRequest.communeId,
    );
    if (compatibleProviders.length === 0) {
      return { leads: [], compatibleProviders: [] };
    }

    const leadRepo = manager.getRepository(Lead);
    const leads = compatibleProviders.map((provider) =>
      leadRepo.create({
        serviceRequestId: serviceRequest.id,
        providerId: provider.id,
        status: LeadStatus.DELIVERED,
        price: 0,
        isPaid: false,
      }),
    );
    const saved = await leadRepo.save(leads);
    return { leads: saved, compatibleProviders };
  }

  /** Emails del match inicial — se llama después de que generateLeadsInTransaction haga commit. */
  async notifyNewMatch(serviceRequest: ServiceRequest, compatibleProviders: Provider[]): Promise<void> {
    if (compatibleProviders.length === 0) return;
    await this.emailService.sendLeadMatchedToCustomer(serviceRequest, compatibleProviders.length);
    for (const provider of compatibleProviders) {
      await this.emailService.sendNewLeadToProvider(provider, serviceRequest);
    }
  }

  /**
   * Contraparte de generateLeadsInTransaction: se llama cuando un provider
   * pasa a ACTIVE o actualiza servicios/comunas, para no dejar colgadas las
   * solicitudes SUBMITTED que ya existían y ahora sí califican. El índice
   * único (serviceRequestId, providerId) en Lead evita duplicados si esto se
   * llama más de una vez para el mismo provider.
   *
   * Los leads y el cambio de estado de las solicitudes van en una sola
   * transacción: si el update de estado fallara después de guardar los leads,
   * una solicitud quedaría con un lead activo pero marcada SUBMITTED, y un
   * reintento posterior chocaría con el índice único al tratar de recrear el
   * mismo lead. Los emails van después del commit.
   */
  async retryMatchingForProvider(providerId: string): Promise<Lead[]> {
    const pendingRequests = await this.matchingService.findPendingServiceRequestsForProvider(providerId);
    if (pendingRequests.length === 0) return [];

    const saved = await this.dataSource.transaction(async (manager) => {
      const leadRepo = manager.getRepository(Lead);
      const leads = pendingRequests.map((sr) =>
        leadRepo.create({
          serviceRequestId: sr.id,
          providerId,
          status: LeadStatus.DELIVERED,
          price: 0,
          isPaid: false,
        }),
      );
      const savedLeads = await leadRepo.save(leads);

      await manager
        .createQueryBuilder()
        .update(ServiceRequest)
        .set({ status: ServiceRequestStatus.MATCHED })
        .whereInIds(pendingRequests.map((sr) => sr.id))
        .execute();

      return savedLeads;
    });

    const provider = await this.providerRepository.findOne({ where: { id: providerId } });
    if (provider) {
      for (const sr of pendingRequests) {
        await this.emailService.sendNewLeadToProvider(provider, sr);
        await this.emailService.sendNewProviderMatchToCustomer(sr, provider);
      }
    }

    return saved;
  }

  /**
   * Cuando se suspende un provider, sus leads en curso quedan huérfanos: el
   * cliente puede creer que lo van a contactar y nunca pasa nada. Se expiran
   * todos los que no estén ya en un estado terminal. Si el cliente ya tenía
   * una expectativa real (ACCEPTED/CONTACTED, no un simple "fue entregado"),
   * se le avisa. Si una solicitud se queda sin ningún lead activo, vuelve a
   * SUBMITTED para que el matching la retome más adelante (otro provider que
   * se active o actualice sus servicios/comunas la puede volver a encontrar).
   */
  async expireActiveLeadsForProvider(provider: Provider): Promise<void> {
    const leads = await this.leadRepository.find({
      where: { providerId: provider.id, status: In(ACTIVE_LEAD_STATUSES) },
      relations: { serviceRequest: { service: true, commune: true } },
    });
    if (leads.length === 0) return;

    // Quiénes necesitan el email se decide ANTES de mutar el status en memoria.
    const leadsNeedingCustomerEmail = leads.filter(
      (lead) => lead.status === LeadStatus.ACCEPTED || lead.status === LeadStatus.CONTACTED,
    );

    // Expirar los leads y, si corresponde, revertir la solicitud a SUBMITTED van
    // en una sola transacción: si el revert fallara después de expirar los leads,
    // una solicitud se quedaría sin leads activos pero marcada MATCHED para siempre,
    // invisible para el retry de matching (que solo mira SUBMITTED).
    await this.dataSource.transaction(async (manager) => {
      for (const lead of leads) {
        lead.status = LeadStatus.EXPIRED;
      }
      await manager.save(Lead, leads);

      const affectedServiceRequestIds = [...new Set(leads.map((lead) => lead.serviceRequestId))];
      for (const serviceRequestId of affectedServiceRequestIds) {
        const remainingActive = await manager.count(Lead, {
          where: { serviceRequestId, status: In(ACTIVE_LEAD_STATUSES) },
        });
        if (remainingActive === 0) {
          await manager.update(ServiceRequest, serviceRequestId, { status: ServiceRequestStatus.SUBMITTED });
        }
      }
    });

    for (const lead of leadsNeedingCustomerEmail) {
      await this.emailService.sendProviderUnavailableToCustomer(lead.serviceRequest, provider);
    }
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
    const lead = await this.leadRepository.findOne({
      where: { id: leadId },
      relations: { serviceRequest: { service: true, commune: true }, provider: true },
    });
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
    const saved = await this.leadRepository.save(lead);

    if (nextStatus === LeadStatus.CONTACTED) {
      await this.emailService.sendLeadContactedToCustomer(lead.serviceRequest, lead.provider);
    }

    return saved;
  }

  async findByIdForAdmin(id: string): Promise<Lead> {
    const lead = await this.leadRepository.findOne({
      where: { id },
      relations: { provider: true, serviceRequest: { service: true, commune: true, category: true } },
    });
    if (!lead) throw new NotFoundException('Lead no encontrado');
    return lead;
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
