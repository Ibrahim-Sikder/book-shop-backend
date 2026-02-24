import { ApiProperty } from '@nestjs/swagger';

export class CouponResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  code: string;

  @ApiProperty()
  type: string;

  @ApiProperty()
  value: number;

  @ApiProperty()
  minAmount: number | null;

  @ApiProperty()
  maxDiscount: number | null;

  @ApiProperty()
  usageLimit: number | null;

  @ApiProperty()
  usedCount: number;

  @ApiProperty()
  expiresAt: Date | null;

  @ApiProperty()
  isActive: boolean;
}
