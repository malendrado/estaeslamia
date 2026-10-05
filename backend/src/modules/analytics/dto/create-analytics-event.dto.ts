import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { AnalyticsEventType } from '../analytics-event-type.enum';

export class CreateAnalyticsEventDto {
  @ApiProperty({ enum: AnalyticsEventType })
  @IsEnum(AnalyticsEventType)
  eventType: AnalyticsEventType;

  @ApiProperty({ required: false, example: '/solicitar' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  path?: string;
}
