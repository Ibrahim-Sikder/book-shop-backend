import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsUUID, IsOptional } from 'class-validator';

export class CreateOrderDto {
  @ApiProperty({ example: 'uuid-of-address' })
  @IsUUID()
  @IsNotEmpty()
  addressId: string;

  @ApiProperty({ example: 'Please deliver between 9AM-5PM' })
  @IsString()
  @IsOptional()
  note?: string;

  @ApiProperty({ example: 'SAVE10' })
  @IsString()
  @IsOptional()
  couponCode?: string;
}
