import { Column, Entity, Index, OneToOne } from 'typeorm';
import { Exclude, Expose } from 'class-transformer';
import { BaseEntity } from '../../../common/entities/base.entity';
import { UserRole } from '../../../common/enums';
import { Provider } from '../../providers/entities/provider.entity';

@Entity('users')
export class User extends BaseEntity {
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 255 })
  email: string;

  /**
   * Nullable: un CUSTOMER creado implícitamente al enviar una ServiceRequest
   * sin registro no tiene password hasta que decide crear una cuenta real.
   */
  @Exclude({ toPlainOnly: true })
  @Column({ name: 'password_hash', type: 'varchar', length: 255, nullable: true })
  passwordHash: string | null;

  @Column({ type: 'varchar', length: 150 })
  name: string;

  @Column({ type: 'varchar', length: 30, nullable: true })
  phone: string | null;

  @Column({ type: 'enum', enum: UserRole })
  role: UserRole;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  /**
   * Seguro de exponer al frontend (a diferencia de passwordHash): permite
   * distinguir un customer "silencioso" (isActive=false, sin password) de
   * una cuenta real suspendida por un admin (isActive=false, con password),
   * sin filtrar nada sobre la contraseña en sí.
   */
  @Expose()
  get hasPassword(): boolean {
    return !!this.passwordHash;
  }

  @OneToOne(() => Provider, (provider) => provider.user)
  provider?: Provider;
}
