import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UserRole } from '../../common/enums';
import { PaginatedResult, paginate } from '../../common/types/paginated-result.type';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  async createUser(data: {
    email: string;
    passwordHash: string | null;
    name: string;
    phone?: string | null;
    role: UserRole;
    isActive?: boolean;
  }): Promise<User> {
    const user = this.userRepository.create({
      email: data.email,
      passwordHash: data.passwordHash,
      name: data.name,
      phone: data.phone ?? null,
      role: data.role,
      isActive: data.isActive ?? true,
    });
    return this.userRepository.save(user);
  }

  /**
   * Busca un usuario por email o lo crea "silencioso" (sin password, isActive=false).
   * Usado al crear una ServiceRequest sin registro previo (Fase 3).
   */
  async findOrCreateSilentCustomer(data: { email: string; name: string; phone: string }): Promise<User> {
    const existing = await this.findByEmail(data.email);
    if (existing) return existing;
    return this.createUser({
      email: data.email,
      passwordHash: null,
      name: data.name,
      phone: data.phone,
      role: UserRole.CUSTOMER,
      isActive: false,
    });
  }

  async activateAsRegisteredCustomer(userId: string, passwordHash: string, name?: string): Promise<User> {
    await this.userRepository.update(userId, {
      passwordHash,
      isActive: true,
      ...(name ? { name } : {}),
    });
    return this.userRepository.findOneOrFail({ where: { id: userId } });
  }

  /** Igual que activateAsRegisteredCustomer, pero para login con Google: no hay password que setear. */
  async activateSilentCustomer(userId: string, name?: string): Promise<User> {
    await this.userRepository.update(userId, {
      isActive: true,
      ...(name ? { name } : {}),
    });
    return this.userRepository.findOneOrFail({ where: { id: userId } });
  }

  /**
   * Listado paginado para el panel de Admin ("gestionar usuarios" — brief original sección 4/20).
   * No incluye a los customers "silenciosos" sin filtrar explícitamente, para no inundar la
   * vista con registros internos que el cliente nunca supo que existían.
   */
  async findAllForAdmin(filters: {
    role?: UserRole;
    isActive?: boolean;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResult<User>> {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;

    const [data, total] = await this.userRepository.findAndCount({
      where: {
        ...(filters.role ? { role: filters.role } : {}),
        ...(filters.isActive !== undefined ? { isActive: filters.isActive } : {}),
      },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return paginate(data, total, page, limit);
  }

  async findByIdForAdmin(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }

  /**
   * Suspende o reactiva una cuenta. No permite reactivar cuentas "silenciosas"
   * (sin password) — esas se activan solo cuando el dueño se registra de verdad.
   */
  async setActiveStatus(id: string, isActive: boolean): Promise<User> {
    const user = await this.findByIdForAdmin(id);
    if (isActive && !user.passwordHash) {
      throw new BadRequestException('No se puede activar una cuenta sin contraseña (customer silencioso)');
    }
    user.isActive = isActive;
    return this.userRepository.save(user);
  }
}
