import { Injectable, NotFoundException, Logger, BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentService } from '../payment/payment.service';

@Injectable()
export class SlotService {
  private readonly logger = new Logger(SlotService.name);

  constructor(private readonly prisma: PrismaService, private readonly paymentService: PaymentService) {}

  /**
   * Purchase slots: create a payment for `slots * 1 GHS` and return the payment initialization result.
   * The frontend should redirect the user to the provided authorization_url.
   */
  async purchaseSlots(userId: number, slots: number) {
    // Enhanced validation with better error messages
    if (!userId || typeof userId !== 'number' || userId <= 0) {
      this.logger.error(`Invalid userId: ${userId} (type: ${typeof userId})`);
      throw new BadRequestException(`Invalid userId: must be a positive number, received: ${userId}`);
    }
    
    if (!slots || typeof slots !== 'number' || slots <= 0) {
      this.logger.error(`Invalid slots: ${slots} (type: ${typeof slots})`);
      throw new BadRequestException(`Invalid slots: must be a positive number, received: ${slots}`);
    }

    this.logger.log(`purchaseSlots start: user=${userId} slots=${slots}`);

    let user;
    try {
      user = await this.prisma.user.findUnique({ where: { id: userId } });
    } catch (err: any) {
      // Prisma connection errors use codes like P1001
      if (err?.code === 'P1001') {
        this.logger.error('Database connection error while attempting to purchase slots', err);
        throw new ServiceUnavailableException('Database is unreachable. Please try again later.');
      }
      // Re-throw unexpected errors to be handled by global exception handler
      this.logger.error(`Unexpected database error: ${err?.message}`, err);
      throw err;
    }

    if (!user) {
      this.logger.warn(`purchaseSlots: user ${userId} not found`);
      throw new NotFoundException(`User ${userId} not found`);
    }

    const amount = Number(slots) * 1; // 1 GHS per slot

    const metadata = { provider: 'paystack', slotsGranted: slots, paymentType: 'SLOT' };

    // create payment via PaymentService which will initialize Paystack when metadata.provider === 'paystack'
  const result = await this.paymentService.createPayment(userId, amount, undefined, metadata);

  this.logger.log(`purchaseSlots: createPayment result for user=${userId} => success=${result.success} providerReference=${result.providerReference ?? 'n/a'}`);

    if (!result.success) {
      this.logger.error(`Failed to create slot purchase payment for user ${userId}: ${result.error}`);
      throw new BadRequestException(`Failed to create payment: ${result.error || 'Unknown error'}`);
    }

    // IMPORTANT: do NOT credit slots here. We should only credit after the payment
    // provider confirms success (via webhook/callback). Crediting now would grant
    // slots before payment is validated and is a security/data-integrity issue.
    // The webhook handler (PaymentService.handleWebhook) should perform the
    // atomic update to payment + user slots (idempotent).
    return result;
  }

  /**
   * Directly credit slots to a user (useful for admin or test flows).
   */
  async creditSlots(userId: number, slots: number) {
    if (slots <= 0) throw new BadRequestException('slots must be a positive integer');

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException(`User ${userId} not found`);

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        availableSlots: { increment: slots },
      },
    });

    this.logger.log(`Credited ${slots} slots to user ${userId}`);
    return updated;
  }

  async getUserSlots(userId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { id: true, availableSlots: true, usedSlots: true } });
    if (!user) throw new NotFoundException(`User ${userId} not found`);
    return user;
  }

  /**
   * Get payment status - useful for frontend to check if payment completed
   */
  async getPaymentStatus(paymentId: number) {
    const payment = await this.prisma.payment.findUnique({ 
      where: { id: paymentId },
      select: { 
        id: true, 
        status: true, 
        amount: true, 
        slotsGranted: true,
        metadata: true,
        createdAt: true,
        updatedAt: true 
      }
    });
    
    if (!payment) {
      throw new NotFoundException(`Payment ${paymentId} not found`);
    }
    
    return {
      ...payment,
      isCompleted: payment.status?.toLowerCase().includes('success'),
      isPending: payment.status?.toLowerCase() === 'pending',
      isFailed: payment.status?.toLowerCase().includes('fail'),
    };
  }
}
