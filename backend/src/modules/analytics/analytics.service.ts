import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AnalyticsEvent } from './entities/analytics-event.entity';
import { AnalyticsEventType } from './analytics-event-type.enum';
import { CreateAnalyticsEventDto } from './dto/create-analytics-event.dto';

export interface AnalyticsSummary {
  sinceDays: number;
  counts: Record<AnalyticsEventType, number>;
}

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(AnalyticsEvent)
    private readonly eventRepository: Repository<AnalyticsEvent>,
  ) {}

  async record(dto: CreateAnalyticsEventDto): Promise<void> {
    // Fire-and-forget desde el punto de vista del cliente: nunca debe tirar un error
    // visible al usuario solo porque falló el tracking.
    await this.eventRepository.save(
      this.eventRepository.create({ eventType: dto.eventType, path: dto.path ?? null }),
    );
  }

  async getSummary(days = 30): Promise<AnalyticsSummary> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const rows = await this.eventRepository
      .createQueryBuilder('e')
      .select('e.eventType', 'eventType')
      .addSelect('COUNT(*)', 'count')
      .where('e.createdAt >= :since', { since })
      .groupBy('e.eventType')
      .getRawMany<{ eventType: AnalyticsEventType; count: string }>();

    const counts = Object.values(AnalyticsEventType).reduce(
      (acc, type) => ({ ...acc, [type]: 0 }),
      {} as Record<AnalyticsEventType, number>,
    );
    for (const row of rows) {
      counts[row.eventType] = parseInt(row.count, 10);
    }

    return { sinceDays: days, counts };
  }
}
