import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { ServiceRequestStatus } from '../../../common/enums';
import { User } from '../../users/entities/user.entity';
import { Category } from '../../categories/entities/category.entity';
import { Service } from '../../services/entities/service.entity';
import { Commune } from '../../communes/entities/commune.entity';

@Entity('service_requests')
@Index(['serviceId', 'communeId', 'status']) // clave para el matching engine
@Index(['status'])
export class ServiceRequest extends BaseEntity {
  @Column({ name: 'customer_id', type: 'uuid' })
  customerId: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'customer_id' })
  customer: User;

  @Column({ name: 'category_id', type: 'uuid' })
  categoryId: string;

  @ManyToOne(() => Category, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @Column({ name: 'service_id', type: 'uuid' })
  @Index()
  serviceId: string;

  @ManyToOne(() => Service, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'service_id' })
  service: Service;

  @Column({ name: 'commune_id', type: 'uuid' })
  @Index()
  communeId: string;

  @ManyToOne(() => Commune, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'commune_id' })
  commune: Commune;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'varchar', length: 300, nullable: true })
  address: string | null;

  @Column({ name: 'preferred_date', type: 'date', nullable: true })
  preferredDate: string | null;

  @Column({ name: 'budget_min', type: 'numeric', precision: 12, scale: 0, nullable: true })
  budgetMin: number | null;

  @Column({ name: 'budget_max', type: 'numeric', precision: 12, scale: 0, nullable: true })
  budgetMax: number | null;

  // Snapshot de contacto al momento de la solicitud (independiente de si el User luego cambia sus datos)
  @Column({ name: 'contact_name', type: 'varchar', length: 150 })
  contactName: string;

  @Column({ name: 'contact_email', type: 'varchar', length: 255 })
  contactEmail: string;

  @Column({ name: 'contact_phone', type: 'varchar', length: 30 })
  contactPhone: string;

  @Column({ name: 'consent_accepted_at', type: 'timestamptz' })
  consentAcceptedAt: Date;

  @Column({ type: 'enum', enum: ServiceRequestStatus, default: ServiceRequestStatus.DRAFT })
  status: ServiceRequestStatus;
}
