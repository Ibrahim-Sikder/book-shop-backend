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

  async getCart(userId: string) {
    let cart = await this.prisma.cart.findFirst({
      where: { userId, checkedOut: false },
      include: {
        cartItems: {
          include: {
            product: { include: { images: true } },
            variant: true,
          },
        },
      },
    });

    if (!cart) {
      cart = await this.prisma.cart.create({
        data: { userId },
        include: { cartItems: true },
      });
    }
    return cart;
  }

  async addToCart(userId: string, dto: AddToCartDto) {
    // 1. Validate Product/Variant
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
      include: { variants: true },
    });

    if (!product) throw new NotFoundException('Product not found');

    // If variantId is provided, validate it exists and belongs to product
    let variant = null;
    if (dto.variantId) {
      variant = product.variants.find((v) => v.id === dto.variantId);
      if (!variant)
        throw new BadRequestException('Invalid variant for this product');

      if (variant.stock < dto.quantity) {
        throw new BadRequestException('Insufficient stock for this variant');
      }
    } else {
      // Simple product check
      if (product.stock < dto.quantity) {
        throw new BadRequestException('Insufficient stock');
      }
    }

    // 2. Get or Create Cart
    let cart = await this.prisma.cart.findFirst({
      where: { userId, checkedOut: false },
    });

    if (!cart) {
      cart = await this.prisma.cart.create({ data: { userId } });
    }

    // 3. Check if item exists in cart
    const existingItem = await this.prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId: dto.productId,
        variantId: dto.variantId, // Match both product and variant
      },
    });

    if (existingItem) {
      return this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + dto.quantity },
      });
    } else {
      // Price logic: Variant price takes precedence over Product price
      const price = variant ? variant.price : product.price;

      return this.prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: dto.productId,
          variantId: dto.variantId,
          quantity: dto.quantity,
          unitPrice: price,
        },
      });
    }
  }

  async removeFromCart(userId: string, itemId: string) {
    const cart = await this.prisma.cart.findFirst({
      where: { userId, checkedOut: false },
    });
    if (!cart) throw new NotFoundException('Cart not found');

    return this.prisma.cartItem.deleteMany({
      where: { id: itemId, cartId: cart.id },
    });
  }

  async clearCart(userId: string) {
    const cart = await this.prisma.cart.findFirst({
      where: { userId, checkedOut: false },
    });
    if (!cart) return { message: 'Cart is already empty' };

    await this.prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });
    return { message: 'Cart cleared' };
  }
}
