import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderStatus, PaymentStatus, Prisma } from '@prisma/client';

@Injectable()
export class OrderService {
  constructor(private prisma: PrismaService) {}

  async createOrder(userId: string, dto: CreateOrderDto) {
    // 1. Get Address
    const address = await this.prisma.address.findFirst({
      where: { id: dto.addressId, userId },
    });
    if (!address) throw new NotFoundException('Address not found');

    // 2. Get Active Cart
    const cart = await this.prisma.cart.findFirst({
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

    if (!cart || cart.cartItems.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    // 3. Calculate Totals & Validate Stock
    let subTotal = 0;
    for (const item of cart.cartItems) {
      if (!item.product) continue;

      const price = item.variant ? item.variant.price : item.product.price;
      subTotal += Number(price) * item.quantity;

      const stock = item.variant ? item.variant.stock : item.product.stock;
      if (stock < item.quantity) {
        throw new BadRequestException(
          `Insufficient stock for ${item.product.name}`,
        );
      }
    }

    // 4. Transaction
    const order = await this.prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          userId,
          orderNumber: `ORD-${Date.now()}`,
          status: OrderStatus.PENDING,
          subTotal,
          totalAmount: subTotal,
          shippingAddress: `${address.street}, ${address.city}, ${address.country}`,
          billingAddress: `${address.street}, ${address.city}`,
          note: dto.note,
          cartId: cart.id,
        },
      });

      for (const item of cart.cartItems) {
        if (!item.product) continue;

        const price = item.variant ? item.variant.price : item.product.price;

        // FIX: Use Prisma.JsonNull instead of raw null for JSON fields
        const attributesInput = item.variant
          ? (item.variant.attributes as Prisma.InputJsonValue)
          : Prisma.JsonNull;

        // FIX: Safely get image URL
        const firstImageUrl =
          item.product.images && item.product.images.length > 0
            ? item.product.images[0].url
            : null;

        await tx.orderItem.create({
          data: {
            orderId: newOrder.id,
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
            price: price, // Prisma usually accepts number for Decimal fields
            productName: item.product.name,
            productImage: firstImageUrl,
            productAttributes: attributesInput,
          },
        });

        // Deduct Stock
        if (item.variant) {
          await tx.productVariant.update({
            where: { id: item.variantId! }, // Safe because item.variant exists
            data: { stock: { decrement: item.quantity } },
          });
        } else {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } },
          });
        }
      }

      // Mark Cart Checked Out
      await tx.cart.update({
        where: { id: cart.id },
        data: { checkedOut: true },
      });

      // Create Pending Payment
      await tx.payment.create({
        data: {
          orderId: newOrder.id,
          userId,
          amount: newOrder.totalAmount,
          status: PaymentStatus.PENDING,
        },
      });

      return newOrder;
    });

    return order;
  }

  async getOrders(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      include: { orderItems: true, payment: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
