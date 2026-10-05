import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Provider } from './entities/provider.entity';
import { ProviderService as ProviderServiceEntity } from './entities/provider-service.entity';
import { ProviderCommune } from './entities/provider-commune.entity';
import { Service } from '../services/entities/service.entity';
import { Commune } from '../communes/entities/commune.entity';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { RegisterProviderDto } from './dto/register-provider.dto';
import { UpdateProviderDto } from './dto/update-provider.dto';
import { UserRole, ProviderStatus, PROVIDER_VALID_TRANSITIONS } from '../../common/enums';
import { PaginatedResult, paginate } from '../../common/types/paginated-result.type';
import { TurnstileService } from '../../common/services/turnstile.service';
import { SupabaseStorageService } from '../../common/services/supabase-storage.service';

const SALT_ROUNDS = 10;

@Injectable()
export class ProvidersService {
  constructor(
    @InjectRepository(Provider)
    private readonly providerRepository: Repository<Provider>,
    @InjectRepository(ProviderServiceEntity)
    private readonly providerServiceRepository: Repository<ProviderServiceEntity>,
    @InjectRepository(ProviderCommune)
    private readonly providerCommuneRepository: Repository<ProviderCommune>,
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
    @InjectRepository(Commune)
    private readonly communeRepository: Repository<Commune>,
    private readonly usersService: UsersService,
    private readonly dataSource: DataSource,
    private readonly turnstileService: TurnstileService,
    private readonly storageService: SupabaseStorageService,
  ) {}

  /**
   * Crea el User (rol PROVIDER) y el Provider (status PENDING) en una sola transacción:
   * si algo falla, no debe quedar un usuario huérfano sin perfil de empresa.
   */
  async register(dto: RegisterProviderDto, remoteIp?: string): Promise<Provider> {
    await this.turnstileService.verify(dto.turnstileToken, remoteIp);

    const existingUser = await this.usersService.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException('Ya existe una cuenta registrada con ese email');
    }

    return this.dataSource.transaction(async (manager) => {
      const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);

      const user = manager.create(User, {
        email: dto.email,
        passwordHash,
        name: dto.contactName,
        phone: dto.phone,
        role: UserRole.PROVIDER,
        isActive: true,
      });
      const savedUser = await manager.save(User, user);

      const provider = manager.create(Provider, {
        userId: savedUser.id,
        businessName: dto.businessName,
        description: dto.description ?? null,
        phone: dto.phone,
        email: dto.email,
        website: dto.website ?? null,
        whatsapp: dto.whatsapp ?? null,
        status: ProviderStatus.PENDING,
      });
      return manager.save(Provider, provider);
    });
  }

  async findByUserId(userId: string): Promise<Provider> {
    const provider = await this.providerRepository.findOne({
      where: { userId },
      relations: { providerServices: true, providerCommunes: true },
    });
    if (!provider) throw new NotFoundException('Perfil de empresa no encontrado para este usuario');
    return provider;
  }

  async findById(id: string): Promise<Provider> {
    const provider = await this.providerRepository.findOne({ where: { id } });
    if (!provider) throw new NotFoundException('Provider no encontrado');
    return provider;
  }

  async findAllForAdmin(status?: ProviderStatus, page = 1, limit = 20): Promise<PaginatedResult<Provider>> {
    const [data, total] = await this.providerRepository.findAndCount({
      where: status ? { status } : {},
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return paginate(data, total, page, limit);
  }

  /**
   * Providers destacados para la landing pública. Expone deliberadamente solo
   * businessName/description/servicios — NO teléfono/email/whatsapp, que quedan
   * detrás del flujo de leads (así se protege el futuro modelo de pago por lead).
   */
  async findFeatured(limit = 6): Promise<
    Array<{ id: string; businessName: string; description: string | null; logoUrl: string | null; services: string[] }>
  > {
    const providers = await this.providerRepository
      .createQueryBuilder('provider')
      .leftJoinAndSelect('provider.providerServices', 'ps')
      .leftJoinAndSelect('ps.service', 'service')
      .where('provider.status = :status', { status: ProviderStatus.ACTIVE })
      .orderBy('RANDOM()')
      .take(limit)
      .getMany();

    return providers.map((provider) => ({
      id: provider.id,
      businessName: provider.businessName,
      description: provider.description,
      logoUrl: provider.logoUrl,
      services: (provider.providerServices ?? []).map((ps) => ps.service?.name).filter((name): name is string => !!name),
    }));
  }

  async updateOwnProfile(userId: string, dto: UpdateProviderDto): Promise<Provider> {
    const provider = await this.findByUserId(userId);
    Object.assign(provider, dto);
    return this.providerRepository.save(provider);
  }

  /**
   * Sube el logo a Supabase Storage y guarda la URL pública resultante.
   * La validación de tipo/tamaño ya ocurrió en el FileInterceptor del controller.
   */
  async updateLogo(userId: string, file: Express.Multer.File): Promise<Provider> {
    const provider = await this.findByUserId(userId);

    const extensionByMime: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
    };

    const logoUrl = await this.storageService.uploadPublicFile({
      buffer: file.buffer,
      mimeType: file.mimetype,
      extension: extensionByMime[file.mimetype] ?? 'bin',
      folder: `providers/${provider.id}`,
    });

    provider.logoUrl = logoUrl;
    return this.providerRepository.save(provider);
  }

  /**
   * Reemplaza completamente el conjunto de servicios ofrecidos por el provider.
   * Valida que todos los serviceIds existan antes de aplicar el cambio.
   */
  async setServices(userId: string, serviceIds: string[]): Promise<ProviderServiceEntity[]> {
    const provider = await this.findByUserId(userId);

    if (serviceIds.length > 0) {
      const foundCount = await this.serviceRepository.count({ where: serviceIds.map((id) => ({ id })) });
      if (foundCount !== serviceIds.length) {
        throw new BadRequestException('Uno o más serviceIds no existen');
      }
    }

    await this.providerServiceRepository.delete({ providerId: provider.id });
    const entries = serviceIds.map((serviceId) =>
      this.providerServiceRepository.create({ providerId: provider.id, serviceId }),
    );
    return this.providerServiceRepository.save(entries);
  }

  /**
   * Reemplaza completamente el conjunto de comunas de cobertura del provider.
   */
  async setCommunes(userId: string, communeIds: string[]): Promise<ProviderCommune[]> {
    const provider = await this.findByUserId(userId);

    if (communeIds.length > 0) {
      const foundCount = await this.communeRepository.count({ where: communeIds.map((id) => ({ id })) });
      if (foundCount !== communeIds.length) {
        throw new BadRequestException('Uno o más communeIds no existen');
      }
    }

    await this.providerCommuneRepository.delete({ providerId: provider.id });
    const entries = communeIds.map((communeId) =>
      this.providerCommuneRepository.create({ providerId: provider.id, communeId }),
    );
    return this.providerCommuneRepository.save(entries);
  }

  async updateStatus(id: string, nextStatus: ProviderStatus): Promise<Provider> {
    const provider = await this.findById(id);
    const allowed = PROVIDER_VALID_TRANSITIONS[provider.status];
    if (!allowed.includes(nextStatus)) {
      throw new ForbiddenException(`No se puede pasar de ${provider.status} a ${nextStatus}`);
    }
    provider.status = nextStatus;
    return this.providerRepository.save(provider);
  }
}
