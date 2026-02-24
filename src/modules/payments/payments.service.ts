import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payments-dto';
import { PaymentResponseDto } from './dto/payments-response-dto';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  async create(
    userId: string,
    dto: CreatePaymentDto,
  ): Promise<PaymentResponseDto> {
    // 1. Safety Check
    if (!userId) {
      throw new BadRequestException(
        'User ID is missing. Are you authenticated?',
      );
    }

    // 2. Verify order belongs to user
    const order = await this.prisma.order.findFirst({
      where: { id: dto.orderId, userId },
    });

    if (!order) throw new NotFoundException('Order not found');

    // 3. Check if payment already exists
    const existingPayment = await this.prisma.payment.findUnique({
      where: { orderId: dto.orderId },
    });

    if (existingPayment) {
      throw new BadRequestException('Payment already initiated for this order');
    }

    // 4. Create Payment
    const payment = await this.prisma.payment.create({
      data: {
        userId,
        // Since 'orderId' is defined in your Prisma Schema,
        // we assign it directly. We do NOT use 'connect'.
        orderId: dto.orderId,
        amount: dto.amount,
        paymentMethod: dto.paymentMethod,
        transactionId: dto.transactionId,
        status: 'PENDING',
      },
    });

    return this.mapToDto(payment);
  }

  async findAll(userId: string) {
    if (!userId) throw new BadRequestException('User ID missing');

    const payments = await this.prisma.payment.findMany({
      where: { userId },
      include: { order: true },
      orderBy: { createdAt: 'desc' },
    });
    return payments.map((p) => this.mapToDto(p));
  }

  async findOne(id: string, userId: string) {
    if (!userId) throw new BadRequestException('User ID missing');

    const payment = await this.prisma.payment.findFirst({
      where: { id, userId },
      include: { order: true },
    });
    if (!payment) throw new NotFoundException('Payment not found');
    return this.mapToDto(payment);
  }

  async updateStatus(id: string, status: string) {
    const updated = await this.prisma.payment.update({
      where: { id },
      data: { status: status as any },
    });

    // If payment completed, update order status
    if (status === 'COMPLETED') {
      await this.prisma.order.update({
        where: { id: updated.orderId },
        data: { status: 'PROCESSING' },
      });
    }

    return this.mapToDto(updated);
  }

  private mapToDto(payment: any): PaymentResponseDto {
    return {
      id: payment.id,
      amount: Number(payment.amount),
      status: payment.status,
      currency: payment.currency,
      paymentMethod: payment.paymentMethod,
      transactionId: payment.transactionId,
      orderId: payment.orderId,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
    };
  }
}
