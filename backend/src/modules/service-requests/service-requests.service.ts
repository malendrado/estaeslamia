import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ServiceRequest } from './entities/service-request.entity';
import { Category } from '../categories/entities/category.entity';
import { Service } from '../services/entities/service.entity';
import { Commune } from '../communes/entities/commune.entity';
import { UsersService } from '../users/users.service';
import { LeadsService } from '../leads/leads.service';
import { TurnstileService } from '../../common/services/turnstile.service';
import { CreateServiceRequestDto } from './dto/create-service-request.dto';
import { ServiceRequestStatus, SERVICE_REQUEST_VALID_TRANSITIONS } from '../../common/enums';
import { PaginatedResult, paginate } from '../../common/types/paginated-result.type';

export interface CreateServiceRequestResult {
  serviceRequest: ServiceRequest;
  matchesCount: number;
}

@Injectable()
export class ServiceRequestsService {
  constructor(
    @InjectRepository(ServiceRequest)
    private readonly serviceRequestRepository: Repository<ServiceRequest>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
    @InjectRepository(Commune)
    private readonly communeRepository: Repository<Commune>,
    private readonly usersService: UsersService,
    private readonly leadsService: LeadsService,
    private readonly turnstileService: TurnstileService,
    private readonly dataSource: DataSource,
  ) {}

  async create(dto: CreateServiceRequestDto, remoteIp?: string): Promise<CreateServiceRequestResult> {
    await this.turnstileService.verify(dto.turnstileToken, remoteIp);

    if (!dto.consentAccepted) {
      throw new BadRequestException('Debes aceptar el consentimiento para enviar la solicitud');
    }
    if (dto.budgetMin != null && dto.budgetMax != null && dto.budgetMin > dto.budgetMax) {
      throw new BadRequestException('El presupuesto mínimo no puede ser mayor al máximo');
    }

    const [category, service, commune] = await Promise.all([
      this.categoryRepository.findOne({ where: { id: dto.categoryId } }),
      this.serviceRepository.findOne({ where: { id: dto.serviceId } }),
      this.communeRepository.findOne({ where: { id: dto.communeId } }),
    ]);
    if (!category) throw new BadRequestException('categoryId no válido');
    if (!service) throw new BadRequestException('serviceId no válido');
    if (service.categoryId !== category.id) {
      throw new BadRequestException('El servicio seleccionado no pertenece a la categoría indicada');
    }
    if (!commune) throw new BadRequestException('communeId no válido');

    // Crea (o reutiliza) el User CUSTOMER "silencioso" asociado a este email, sin exigir registro.
    const customer = await this.usersService.findOrCreateSilentCustomer({
      email: dto.contactEmail,
      name: dto.contactName,
      phone: dto.contactPhone,
    });

    // La ServiceRequest y sus Leads son una sola unidad: si el matching falla
    // a mitad de camino, no debe quedar una solicitud creada sin sus leads
    // correspondientes (o viceversa). Los emails van después del commit.
    const { serviceRequest, leads, compatibleProviders } = await this.dataSource.transaction(async (manager) => {
      const serviceRequestRepo = manager.getRepository(ServiceRequest);

      let serviceRequest = serviceRequestRepo.create({
        customerId: customer.id,
        categoryId: dto.categoryId,
        serviceId: dto.serviceId,
        communeId: dto.communeId,
        description: dto.description,
        address: dto.address ?? null,
        preferredDate: dto.preferredDate ?? null,
        budgetMin: dto.budgetMin ?? null,
        budgetMax: dto.budgetMax ?? null,
        contactName: dto.contactName,
        contactEmail: dto.contactEmail,
        contactPhone: dto.contactPhone,
        consentAcceptedAt: new Date(),
        status: ServiceRequestStatus.SUBMITTED,
      });
      serviceRequest = await serviceRequestRepo.save(serviceRequest);
      // No se persiste (ManyToOne sin cascade), solo deja el objeto en memoria con lo
      // necesario para el email de "encontramos N empresas" sin una query extra.
      serviceRequest.category = category;
      serviceRequest.service = service;
      serviceRequest.commune = commune;

      // Matching Engine: se ejecuta de inmediato, en el mismo request (MVP, sin colas)
      const { leads, compatibleProviders } = await this.leadsService.generateLeadsInTransaction(serviceRequest, manager);

      if (leads.length > 0) {
        serviceRequest.status = ServiceRequestStatus.MATCHED;
        serviceRequest = await serviceRequestRepo.save(serviceRequest);
      }

      return { serviceRequest, leads, compatibleProviders };
    });

    await this.leadsService.notifyNewMatch(serviceRequest, compatibleProviders);

    return { serviceRequest, matchesCount: leads.length };
  }

  async findAllForCustomer(customerId: string): Promise<ServiceRequest[]> {
    return this.serviceRequestRepository.find({
      where: { customerId },
      relations: { category: true, service: true, commune: true },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Detalle para el dashboard del customer: incluye las empresas encontradas
   * (vía Lead -> Provider) pero solo si la solicitud le pertenece.
   */
  async findDetailForCustomer(customerId: string, id: string) {
    const request = await this.findByIdOrFail(id);
    if (request.customerId !== customerId) {
      throw new ForbiddenException('Esta solicitud no te pertenece');
    }
    const leads = await this.leadsService.findByServiceRequestId(id);
    return {
      request,
      providers: leads.map((lead) => ({ leadStatus: lead.status, contactedAt: lead.contactedAt, ...lead.provider })),
    };
  }

  async findByIdOrFail(id: string): Promise<ServiceRequest> {
    const request = await this.serviceRequestRepository.findOne({
      where: { id },
      relations: { category: true, service: true, commune: true },
    });
    if (!request) throw new NotFoundException('Solicitud no encontrada');
    return request;
  }

  /**
   * Resumen público y seguro: no expone datos de contacto del cliente,
   * solo lo necesario para la pantalla de confirmación ("3 empresas encontradas").
   */
  async findPublicSummary(id: string) {
    const request = await this.findByIdOrFail(id);
    const leads = await this.leadsService.findByServiceRequestId(id);
    return {
      id: request.id,
      status: request.status,
      category: request.category?.name,
      service: request.service?.name,
      commune: request.commune?.name,
      createdAt: request.createdAt,
      matchesCount: leads.length,
    };
  }

  async findAllForAdmin(filters: {
    status?: ServiceRequestStatus;
    serviceId?: string;
    communeId?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResult<ServiceRequest>> {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;

    const [data, total] = await this.serviceRequestRepository.findAndCount({
      where: {
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.serviceId ? { serviceId: filters.serviceId } : {}),
        ...(filters.communeId ? { communeId: filters.communeId } : {}),
      },
      relations: { category: true, service: true, commune: true },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return paginate(data, total, page, limit);
  }

  async updateStatus(id: string, nextStatus: ServiceRequestStatus): Promise<ServiceRequest> {
    const request = await this.findByIdOrFail(id);
    const allowed = SERVICE_REQUEST_VALID_TRANSITIONS[request.status];
    if (!allowed.includes(nextStatus)) {
      throw new BadRequestException(`No se puede pasar de ${request.status} a ${nextStatus}`);
    }
    request.status = nextStatus;
    return this.serviceRequestRepository.save(request);
  }
}
