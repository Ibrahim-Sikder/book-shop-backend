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
    // Define the include object once to ensure the return type is consistent
    const cartInclude = {
      cartItems: {
        include: {
          product: { include: { images: true } },
          variant: true,
        },
      },
    };

    let cart = await this.prisma.cart.findFirst({
      where: { userId, checkedOut: false },
      include: cartInclude,
    });

    if (!cart) {
      cart = await this.prisma.cart.create({
        data: { userId },
        include: cartInclude, // FIX: Apply the same includes here to match the type
      });
    }
    return cart;
  }

  async addToCart(userId: string, dto: AddToCartDto) {
    // 1. Validate Product
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
      include: { variants: true },
    });

    if (!product) throw new NotFoundException('Product not found');

    // 2. Validate Variant and Stock
    let variant: any = null;

    if (dto.variantId) {
      if (product.variants && product.variants.length > 0) {
        variant = product.variants.find((v) => v.id === dto.variantId);
      }

      if (!variant) {
        throw new BadRequestException('Invalid variant for this product');
      }

      if (variant.stock < dto.quantity) {
        throw new BadRequestException('Insufficient stock for this variant');
      }
    } else {
      // If no variant, check main product stock
      if (product.stock < dto.quantity) {
        throw new BadRequestException('Insufficient stock');
      }
    }

    // 3. Get or Create Cart
    let cart = await this.prisma.cart.findFirst({
      where: { userId, checkedOut: false },
    });

    if (!cart) {
      cart = await this.prisma.cart.create({ data: { userId } });
    }

    // 4. Check if item exists in cart (matching both product and variant)
    const existingItem = await this.prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId: dto.productId,
        variantId: dto.variantId || null, // Ensure we match null if no variantId is provided
      },
    });

    if (existingItem) {
      return this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + dto.quantity },
      });
    } else {
      // Determine price: use variant price if available, else product price
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
