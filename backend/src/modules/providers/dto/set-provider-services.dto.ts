import { ApiProperty } from '@nestjs/swagger';
import { ArrayUnique, IsArray, IsUUID } from 'class-validator';

export class SetProviderServicesDto {
  @ApiProperty({ type: [String], description: 'Lista completa de serviceIds que ofrece el provider (reemplaza la anterior)' })
  @IsArray()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  serviceIds: string[];
}
