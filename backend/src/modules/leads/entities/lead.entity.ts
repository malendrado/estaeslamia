import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { LeadStatus } from '../../../common/enums';
import { ServiceRequest } from '../../service-requests/entities/service-request.entity';
import { Provider } from '../../providers/entities/provider.entity';

@Entity('leads')
@Index(['serviceRequestId', 'providerId'], { unique: true })
@Index(['providerId', 'status'])
export class Lead extends BaseEntity {
  @Column({ name: 'service_request_id', type: 'uuid' })
  serviceRequestId: string;

  @ManyToOne(() => ServiceRequest, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'service_request_id' })
  serviceRequest: ServiceRequest;

  @Column({ name: 'provider_id', type: 'uuid' })
  providerId: string;

  @ManyToOne(() => Provider, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'provider_id' })
  provider: Provider;

  @Column({ type: 'enum', enum: LeadStatus, default: LeadStatus.GENERATED })
  status: LeadStatus;

  // Preparado para monetización futura (pago por lead) - no usado en el MVP
  @Column({ type: 'numeric', precision: 12, scale: 0, default: 0 })
  price: number;

  @Column({ name: 'is_paid', type: 'boolean', default: false })
  isPaid: boolean;

  @Column({ name: 'contacted_at', type: 'timestamptz', nullable: true })
  contactedAt: Date | null;
}
