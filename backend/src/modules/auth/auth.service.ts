import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UserRole } from '../../common/enums';
import { User } from '../users/entities/user.entity';
import { TurnstileService } from '../../common/services/turnstile.service';

const SALT_ROUNDS = 10;

export interface AuthResult {
  accessToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
  };
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly turnstileService: TurnstileService,
  ) {}

  /**
   * Registro público genérico. Siempre crea el usuario con rol CUSTOMER:
   * el registro de PROVIDER pasa por POST /providers/register (requiere datos
   * de empresa adicionales) y ADMIN no se autorregistra.
   *
   * Si ya existe un User "silencioso" (creado al enviar una ServiceRequest sin
   * registro previo: sin password, isActive=false), este registro lo activa
   * en vez de fallar por conflicto — así el cliente puede luego ver su
   * Dashboard con las solicitudes que ya había hecho.
   */
  async register(dto: RegisterDto, remoteIp?: string): Promise<AuthResult> {
    await this.turnstileService.verify(dto.turnstileToken, remoteIp);

    const existing = await this.usersService.findByEmail(dto.email);

    if (existing) {
      const isClaimableSilentCustomer = existing.role === UserRole.CUSTOMER && !existing.passwordHash && !existing.isActive;
      if (!isClaimableSilentCustomer) {
        throw new ConflictException('Ya existe una cuenta registrada con ese email');
      }
      const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
      const activated = await this.usersService.activateAsRegisteredCustomer(existing.id, passwordHash, dto.name);
      return this.buildAuthResult(activated);
    }

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
    const user = await this.usersService.createUser({
      email: dto.email,
      passwordHash,
      name: dto.name,
      phone: dto.phone,
      role: UserRole.CUSTOMER,
      isActive: true,
    });

    return this.buildAuthResult(user);
  }

  async login(dto: LoginDto): Promise<AuthResult> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    if (!user.isActive) {
      throw new UnauthorizedException('Esta cuenta está inactiva');
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    return this.buildAuthResult(user);
  }

  buildAuthResult(user: User): AuthResult {
    const accessToken = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }
}
