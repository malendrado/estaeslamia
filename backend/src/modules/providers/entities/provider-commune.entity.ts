import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Provider } from './provider.entity';
import { Commune } from '../../communes/entities/commune.entity';

@Entity('provider_communes')
@Index(['providerId', 'communeId'], { unique: true })
@Index(['communeId'])
export class ProviderCommune extends BaseEntity {
  @Column({ name: 'provider_id', type: 'uuid' })
  providerId: string;

  @ManyToOne(() => Provider, (provider) => provider.providerCommunes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'provider_id' })
  provider: Provider;

  @Column({ name: 'commune_id', type: 'uuid' })
  communeId: string;

  @ManyToOne(() => Commune, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'commune_id' })
  commune: Commune;
}
