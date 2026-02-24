import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AddToCartDto } from './dto/add-to-cart.dto';

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

  // Helper to define includes for consistent typing
  private getCartInclude() {
    return {
      cartItems: {
        include: {
          product: {
            include: { images: true },
          },
          variant: true,
        },
      },
    };
  }

  async getCart(userId: string) {
    const include = this.getCartInclude();

    const cart = await this.prisma.cart.findFirst({
      where: { userId, checkedOut: false },
      include,
    });

    return cart;
  }

  async addToCart(userId: string, dto: AddToCartDto) {
    // 1. Validate Product
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
      include: { variants: true },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // 2. Validate Variant (if provided) and Stock
    let variant: any = null;
    let finalPrice: number;

    if (dto.variantId) {
      // Find specific variant
      variant = product.variants?.find((v) => v.id === dto.variantId);

      if (!variant) {
        throw new BadRequestException('Invalid variant for this product');
      }

      // Check Variant Stock
      if (variant.stock < dto.quantity) {
        throw new BadRequestException(
          `Insufficient stock. Only ${variant.stock} available for this variant.`,
        );
      }

      finalPrice = Number(variant.price);
    } else {
      // No variant, use Product Stock
      if (product.stock < dto.quantity) {
        throw new BadRequestException(
          `Insufficient stock. Only ${product.stock} available.`,
        );
      }

      finalPrice = Number(product.price);
    }

    // 3. Get or Create Active Cart
    let cart = await this.prisma.cart.findFirst({
      where: { userId, checkedOut: false },
    });

    if (!cart) {
      cart = await this.prisma.cart.create({ data: { userId } });
    }

    // 4. Check if Item Already Exists in Cart
    // Note: Prisma handles null matches correctly, so this query works for both variants and simple products
    const existingItem = await this.prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId: dto.productId,
        variantId: dto.variantId || null,
      },
    });

    if (existingItem) {
      // Update quantity
      return this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: existingItem.quantity + dto.quantity,
          // Optional: Update price in case it changed since adding to cart?
          // Usually carts capture price at time of add, so we keep existing unitPrice or update here if needed.
          // For now, we keep the original price or could update: unitPrice: finalPrice
        },
      });
    } else {
      // Create new item
      return this.prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: dto.productId,
          variantId: dto.variantId || null,
          quantity: dto.quantity,
          unitPrice: finalPrice, // Capture price at time of adding
        },
      });
    }
  }

  async removeFromCart(userId: string, itemId: string) {
    // Ensure we only delete items belonging to the user's active cart
    const cart = await this.prisma.cart.findFirst({
      where: { userId, checkedOut: false },
    });

    if (!cart) {
      throw new NotFoundException('Active cart not found');
    }

    // Verify the item belongs to this cart
    const item = await this.prisma.cartItem.findUnique({
      where: { id: itemId },
    });

    if (!item || item.cartId !== cart.id) {
      throw new NotFoundException('Item not found in cart');
    }

    return this.prisma.cartItem.delete({
      where: { id: itemId },
    });
  }

  async clearCart(userId: string) {
    const cart = await this.prisma.cart.findFirst({
      where: { userId, checkedOut: false },
    });

    if (!cart) {
      // Return consistent response
      return { message: 'Cart is already empty' };
    }

    await this.prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    return { message: 'Cart cleared successfully' };
  }
}
