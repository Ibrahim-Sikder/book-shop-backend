import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCouponDto } from './dto/create-coupon-dto';
import { CouponResponseDto } from './dto/coupon-response-dto';
import { UpdateCouponDto } from './dto/update-coupon-dto';

@Injectable()
export class CouponsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateCouponDto): Promise<CouponResponseDto> {
    const coupon = await this.prisma.coupon.create({
      data: {
        ...dto,
        // Convert string date to Date object if provided
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      },
    });
    return this.mapToDto(coupon);
  }

  async findAll() {
    const coupons = await this.prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return coupons.map((c) => this.mapToDto(c));
  }

  async validate(code: string, cartTotal: number) {
    const coupon = await this.prisma.coupon.findUnique({ where: { code } });

    if (!coupon || !coupon.isActive) {
      throw new BadRequestException('Invalid coupon code');
    }

    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      throw new BadRequestException('Coupon has expired');
    }

    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      throw new BadRequestException('Coupon usage limit reached');
    }

    if (coupon.minAmount && cartTotal < Number(coupon.minAmount)) {
      throw new BadRequestException(
        `Minimum order amount ${coupon.minAmount} required`,
      );
    }

    return this.mapToDto(coupon);
  }

  async update(id: string, dto: UpdateCouponDto): Promise<CouponResponseDto> {
    const updated = await this.prisma.coupon.update({
      where: { id },
      data: {
        ...dto,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
      },
    });
    return this.mapToDto(updated);
  }

  async remove(id: string) {
    await this.prisma.coupon.delete({ where: { id } });
    return { message: 'Coupon deleted' };
  }

  private mapToDto(coupon: any): CouponResponseDto {
    return {
      id: coupon.id,
      code: coupon.code,
      type: coupon.type,
      value: Number(coupon.value),
      minAmount: coupon.minAmount ? Number(coupon.minAmount) : null,
      maxDiscount: coupon.maxDiscount ? Number(coupon.maxDiscount) : null,
      usageLimit: coupon.usageLimit,
      usedCount: coupon.usedCount,
      expiresAt: coupon.expiresAt,
      isActive: coupon.isActive,
    };
  }
}
