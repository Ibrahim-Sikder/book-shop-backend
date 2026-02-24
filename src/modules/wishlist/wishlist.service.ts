import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { WishlistResponseDto } from './dto/create-wishlist-dto';

@Injectable()
export class WishlistService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string): Promise<WishlistResponseDto[]> {
    const items = await this.prisma.wishlist.findMany({
      where: { userId },
      include: { product: true },
      orderBy: { createdAt: 'desc' },
    });
    return items.map((item) => ({
      id: item.id,
      userId: item.userId,
      productId: item.productId,
      createdAt: item.createdAt,
    }));
  }

  async toggle(userId: string, productId: string) {
    // Check if exists
    const existing = await this.prisma.wishlist.findUnique({
      where: { userId_productId: { userId, productId } },
    });

    if (existing) {
      // Remove
      await this.prisma.wishlist.delete({
        where: { userId_productId: { userId, productId } },
      });
      return { message: 'Removed from wishlist', action: 'removed' };
    } else {
      // Add
      await this.prisma.wishlist.create({
        data: { userId, productId },
      });
      return { message: 'Added to wishlist', action: 'added' };
    }
  }

  async remove(userId: string, id: string) {
    const item = await this.prisma.wishlist.findFirst({
      where: { id, userId },
    });
    if (!item) throw new NotFoundException('Wishlist item not found');

    await this.prisma.wishlist.delete({ where: { id } });
    return { message: 'Item removed' };
  }
}
