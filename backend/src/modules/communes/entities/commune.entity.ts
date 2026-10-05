import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Region } from '../../regions/entities/region.entity';

@Entity('communes')
@Index(['regionId'])
export class Commune extends BaseEntity {
  @Column({ type: 'varchar', length: 150 })
  name: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 50 })
  code: string;

  @Column({ name: 'region_id', type: 'uuid' })
  regionId: string;

  @ManyToOne(() => Region, (region) => region.communes, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'region_id' })
  region: Region;
}
