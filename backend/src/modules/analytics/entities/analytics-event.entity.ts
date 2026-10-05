import { Column, Entity, Index, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

/**
 * Registro de eventos de producto, mínimo y sin datos personales:
 * ni IP, ni cookies, ni identificador de usuario — solo qué pasó y cuándo.
 * Suficiente para medir el embudo de conversión del MVP (visita → wizard
 * iniciado → solicitud creada → registro) sin necesitar un proveedor externo
 * ni banner de consentimiento de cookies.
 */
@Entity('analytics_events')
@Index(['eventType', 'createdAt'])
export class AnalyticsEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'event_type', type: 'varchar', length: 100 })
  eventType: string;

  @Column({ type: 'varchar', length: 300, nullable: true })
  path: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
