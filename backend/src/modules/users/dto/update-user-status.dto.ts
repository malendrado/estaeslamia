import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateUserStatusDto {
  @ApiProperty({ example: false, description: 'true para reactivar, false para suspender' })
  @IsBoolean()
  isActive: boolean;
}
