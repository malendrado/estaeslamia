import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Provider } from './entities/provider.entity';
import { ProviderService as ProviderServiceEntity } from './entities/provider-service.entity';
import { ProviderCommune } from './entities/provider-commune.entity';
import { Service } from '../services/entities/service.entity';
import { Commune } from '../communes/entities/commune.entity';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { RegisterProviderDto } from './dto/register-provider.dto';
import { RegisterProviderGoogleDto } from './dto/register-provider-google.dto';
import { UpdateProviderDto } from './dto/update-provider.dto';
import { UserRole, ProviderStatus, PROVIDER_VALID_TRANSITIONS } from '../../common/enums';
import { PaginatedResult, paginate } from '../../common/types/paginated-result.type';
import { TurnstileService } from '../../common/services/turnstile.service';
import { SupabaseStorageService } from '../../common/services/supabase-storage.service';
import { GoogleAuthService } from '../../common/services/google-auth.service';
import { EmailService } from '../../common/services/email.service';
import { LeadsService } from '../leads/leads.service';

const SALT_ROUNDS = 10;

/**
 * SVG es XML: un archivo subido por un provider puede traer <script> o
 * atributos on*="..." que, si alguien abre la URL del storage directo (no
 * vía <img>, donde el navegador nunca ejecuta el contenido embebido), sí se
 * ejecutarían. Se quita lo ejecutable antes de subirlo.
 * ponytail: limpieza por regex, no un parser XML real — cubre los vectores
 * conocidos (script, on*=, foreignObject, javascript:) pero no es a prueba de
 * XML malformado a propósito. Si esto se vuelve crítico, migrar a DOMPurify.
 */
function sanitizeSvg(buffer: Buffer): Buffer {
  const cleaned = buffer
    .toString('utf8')
    .replace(/<script[\s\S]*?<\/script\s*>/gi, '')
    .replace(/<foreignObject[\s\S]*?<\/foreignObject\s*>/gi, '')
    .replace(/\son\w+\s*=\s*"(?:[^"]*)"/gi, '')
    .replace(/\son\w+\s*=\s*'(?:[^']*)'/gi, '')
    .replace(/(href|xlink:href)\s*=\s*"javascript:[^"]*"/gi, '$1="#"')
    .replace(/(href|xlink:href)\s*=\s*'javascript:[^']*'/gi, "$1='#'");
  return Buffer.from(cleaned, 'utf8');
}

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
    private readonly googleAuthService: GoogleAuthService,
    private readonly leadsService: LeadsService,
    private readonly emailService: EmailService,
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

  /**
   * Igual que register(), pero el email/nombre vienen verificados del ID
   * token de Google (no de lo que el usuario escriba) y no hay password que
   * hashear — mismo motivo por el que Provider nunca se crea "a medias": si
   * el User ya existiera, no hay forma de completarle el perfil de empresa
   * después sin un endpoint dedicado, así que se rechaza igual que register().
   */
  async registerWithGoogle(dto: RegisterProviderGoogleDto): Promise<Provider> {
    const profile = await this.googleAuthService.verifyIdToken(dto.idToken);

    const existingUser = await this.usersService.findByEmail(profile.email);
    if (existingUser) {
      throw new ConflictException('Ya existe una cuenta registrada con ese email');
    }

    return this.dataSource.transaction(async (manager) => {
      const user = manager.create(User, {
        email: profile.email,
        passwordHash: null,
        name: profile.name,
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
        email: profile.email,
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
    const provider = await this.providerRepository.findOne({
      where: { id },
      relations: { providerServices: { service: true }, providerCommunes: { commune: true } },
    });
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
    // Dos queries en vez de un solo leftJoinAndSelect + ORDER BY RANDOM(): el join hace que
    // TypeORM agregue SELECT DISTINCT para no duplicar providers por el fan-out de la relación
    // one-to-many, y Postgres no permite RANDOM() en el ORDER BY de un DISTINCT si no está en
    // el SELECT. Sin join no hay DISTINCT, así que el random funciona.
    const randomIds = await this.providerRepository
      .createQueryBuilder('provider')
      .select('provider.id')
      .where('provider.status = :status', { status: ProviderStatus.ACTIVE })
      .orderBy('RANDOM()')
      .take(limit)
      .getMany();

    if (randomIds.length === 0) return [];

    const providers = await this.providerRepository.find({
      where: { id: In(randomIds.map((p) => p.id)) },
      relations: { providerServices: { service: true } },
    });

    const orderById = new Map(randomIds.map((p, index) => [p.id, index]));
    providers.sort((a, b) => orderById.get(a.id)! - orderById.get(b.id)!);

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
      'image/svg+xml': 'svg',
    };

    const buffer = file.mimetype === 'image/svg+xml' ? sanitizeSvg(file.buffer) : file.buffer;

    const logoUrl = await this.storageService.uploadPublicFile({
      buffer,
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
    const saved = await this.providerServiceRepository.save(entries);

    if (provider.status === ProviderStatus.ACTIVE) {
      await this.leadsService.retryMatchingForProvider(provider.id);
    }

    return saved;
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
    const saved = await this.providerCommuneRepository.save(entries);

    if (provider.status === ProviderStatus.ACTIVE) {
      await this.leadsService.retryMatchingForProvider(provider.id);
    }

    return saved;
  }

  async updateStatus(id: string, nextStatus: ProviderStatus): Promise<Provider> {
    const provider = await this.findById(id);
    const allowed = PROVIDER_VALID_TRANSITIONS[provider.status];
    if (!allowed.includes(nextStatus)) {
      throw new ForbiddenException(`No se puede pasar de ${provider.status} a ${nextStatus}`);
    }
    provider.status = nextStatus;
    const saved = await this.providerRepository.save(provider);

    if (nextStatus === ProviderStatus.ACTIVE) {
      await this.emailService.sendProviderApproved(provider);
      await this.leadsService.retryMatchingForProvider(provider.id);
    } else if (nextStatus === ProviderStatus.SUSPENDED) {
      await this.leadsService.expireActiveLeadsForProvider(provider);
    }

    return saved;
  }
}
