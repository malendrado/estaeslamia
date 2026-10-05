import { Column, Entity, Index, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Commune } from '../../communes/entities/commune.entity';

@Entity('regions')
export class Region extends BaseEntity {
  @Column({ type: 'varchar', length: 150 })
  name: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 20 })
  code: string;

  @OneToMany(() => Commune, (commune) => commune.region)
  communes: Commune[];
}
