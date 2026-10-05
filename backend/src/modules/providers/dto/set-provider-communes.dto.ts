import { ApiProperty } from '@nestjs/swagger';
import { ArrayUnique, IsArray, IsUUID } from 'class-validator';

export class SetProviderCommunesDto {
  @ApiProperty({ type: [String], description: 'Lista completa de communeIds donde trabaja el provider (reemplaza la anterior)' })
  @IsArray()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  communeIds: string[];
}
