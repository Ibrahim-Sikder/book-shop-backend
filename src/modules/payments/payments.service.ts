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
    // Verify order belongs to user
    const order = await this.prisma.order.findFirst({
      where: { id: dto.orderId, userId },
    });

    if (!order) throw new NotFoundException('Order not found');

    // Check if payment already exists
    const existingPayment = await this.prisma.payment.findUnique({
      where: { orderId: dto.orderId },
    });

    if (existingPayment) {
      throw new BadRequestException('Payment already initiated for this order');
    }

    const payment = await this.prisma.payment.create({
      data: {
        userId,
        ...dto,
        status: 'PENDING', // Default status
      },
    });

    return this.mapToDto(payment);
  }

  async findAll(userId: string) {
    const payments = await this.prisma.payment.findMany({
      where: { userId },
      include: { order: true },
      orderBy: { createdAt: 'desc' },
    });
    return payments.map((p) => this.mapToDto(p));
  }

  async findOne(id: string, userId: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { id, userId },
      include: { order: true },
    });
    if (!payment) throw new NotFoundException('Payment not found');
    return this.mapToDto(payment);
  }

  // Used by Webhooks or Admin to update status
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
