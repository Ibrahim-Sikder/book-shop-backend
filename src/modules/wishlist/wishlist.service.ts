import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class WishlistService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.wishlist.findMany({
      where: { userId },
      include: {
        product: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async toggle(userId: string, productId: string) {
    // 1️⃣ Validate product exists
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // 2️⃣ Check if already exists
    const existing = await this.prisma.wishlist.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    if (existing) {
      await this.prisma.wishlist.delete({
        where: {
          userId_productId: {
            userId,
            productId,
          },
        },
      });

      return {
        success: true,
        action: 'removed',
        productId,
      };
    }

    const newItem = await this.prisma.wishlist.create({
      data: {
        userId,
        productId,
      },
    });

    return {
      success: true,
      action: 'added',
      item: newItem,
    };
  }

  async remove(userId: string, id: string) {
    const item = await this.prisma.wishlist.findFirst({
      where: { id, userId },
    });

    if (!item) {
      throw new NotFoundException('Wishlist item not found');
    }

    await this.prisma.wishlist.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'Item removed successfully',
    };
  }
}
