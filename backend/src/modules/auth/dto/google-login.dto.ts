import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class GoogleLoginDto {
  @ApiProperty({ description: 'ID token entregado por Google Identity Services en el navegador' })
  @IsString()
  idToken: string;
}
