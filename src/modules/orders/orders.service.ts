import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderStatus, PaymentStatus } from '@prisma/client';

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
      include: { cartItems: { include: { product: true, variant: true } } },
    });

    if (!cart || cart.cartItems.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    // 3. Calculate Totals & Validate Stock
    let subTotal = 0;
    for (const item of cart.cartItems) {
      const price = item.variant ? item.variant.price : item.product.price;
      subTotal += Number(price) * item.quantity;

      // Stock Check (Simple)
      const stock = item.variant ? item.variant.stock : item.product.stock;
      if (stock < item.quantity) {
        throw new BadRequestException(
          `Insufficient stock for ${item.product.name}`,
        );
      }
    }

    // 4. Transaction: Create Order, Deduct Stock, Clear Cart
    const order = await this.prisma.$transaction(async (tx) => {
      // Create Order
      const newOrder = await tx.order.create({
        data: {
          userId,
          orderNumber: `ORD-${Date.now()}`,
          status: OrderStatus.PENDING,
          subTotal,
          totalAmount: subTotal, // Add shipping/tax logic here if needed
          shippingAddress: `${address.street}, ${address.city}, ${address.country}`, // Simplified JSON storage would be better
          billingAddress: `${address.street}, ${address.city}`,
          note: dto.note,
          cartId: cart.id,
        },
      });

      // Create Order Items & Deduct Stock
      for (const item of cart.cartItems) {
        const price = item.variant ? item.variant.price : item.product.price;

        await tx.orderItem.create({
          data: {
            orderId: newOrder.id,
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
            price: price,
            productName: item.product.name,
            productImage: item.product.images[0]?.url || null,
            productAttributes: item.variant ? item.variant.attributes : null,
          },
        });

        // Deduct Stock
        if (item.variant) {
          await tx.productVariant.update({
            where: { id: item.variantId },
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

      // Create Pending Payment Record
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
