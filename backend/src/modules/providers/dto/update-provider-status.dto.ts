import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { ProviderStatus } from '../../../common/enums';

export class UpdateProviderStatusDto {
  @ApiProperty({ enum: ProviderStatus })
  @IsEnum(ProviderStatus)
  status: ProviderStatus;
}
