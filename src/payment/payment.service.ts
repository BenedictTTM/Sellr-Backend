import { Injectable, InternalServerErrorException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaystackService } from './paystack.service';

export type CreatePaymentResult = {
  success: boolean;
  data?: any;
  error?: string;
  authorization?: any;
  providerReference?: string;
};

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(private readonly prisma: PrismaService, private readonly paystackService: PaystackService) {}

  /**
   * Create a payment record (marks pending).
   * If meta.provider === 'paystack' this will also attempt to initialize a Paystack transaction
   * and persist the provider reference on the payment record.
   */
  async createPayment(
    userId: number,
    amount: number,
    currency = 'GHS',
    meta?: Record<string, any>,
  ): Promise<CreatePaymentResult> {
    try {
      let metaPreview = '{}';
      try {
        metaPreview = meta ? JSON.stringify(meta) : '{}';
      } catch (_) {
        metaPreview = '[unserializable]';
      }
      this.logger.log(`createPayment start: user=${userId} amount=${amount} currency=${currency} meta=${metaPreview}`);

      // Validate inputs
      if (!userId || typeof userId !== 'number' || userId <= 0) {
        this.logger.error(`Invalid userId in createPayment: ${userId} (type: ${typeof userId})`);
        return { success: false, error: `Invalid userId: ${userId}` };
      }

      if (!amount || typeof amount !== 'number' || amount <= 0) {
        this.logger.error(`Invalid amount in createPayment: ${amount} (type: ${typeof amount})`);
        return { success: false, error: `Invalid amount: ${amount}` };
      }

      const createData: any = {
        userId,
        amount,
        currency,
        status: 'pending',
        providerPaymentId: meta?.providerPaymentId ?? null,
        metadata: meta ?? {},
        premiumTier: meta?.premiumTier ?? 'FREE',
        slotsGranted: meta?.slotsGranted ?? 0,
        validityMonths: meta?.validityMonths ?? 0,
        paymentType: meta?.paymentType ?? 'PREMIUM',
      };

      const created = await this.prisma.payment.create({ data: createData });
      this.logger.log(`Payment record created: id=${created.id} user=${userId} amount=${amount} status=pending`);

      // If metadata requests Paystack initialization, attempt to initialize and return the authorization URL
      if (meta && meta.provider === 'paystack') {
        // fetch user email
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        const email = user?.email || meta?.email;
        if (!email) {
          this.logger.warn('No email available for Paystack initialization');
          return { success: false, data: created, error: 'No email for paystack initialization' };
        }

        try {
          const reference = `payment-${created.id}-${Date.now()}`;
          
          // Construct callback URL - use frontend URL for redirect after payment
          const frontendUrl = process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000';
          const callbackUrl = `${frontendUrl}/payment-success`;
          
          this.logger.log(`Initializing Paystack transaction: paymentId=${created.id} reference=${reference} email=${email} amount=${amount} callback=${callbackUrl}`);
          const init = await this.paystackService.initializeTransaction(email, amount, reference, callbackUrl);

          // store providerPaymentId on the record (reference)
          await this.prisma.payment.update({
            where: { id: created.id },
            data: { providerPaymentId: init.reference } as any,
          });

          this.logger.log(`Paystack initialized: paymentId=${created.id} providerReference=${init.reference}`);
          return { success: true, data: created, authorization: init, providerReference: init.reference };
        } catch (err) {
          this.logger.error('Paystack initialization failed', err as any);
          // Payment record created but external initialization failed - return that fact to caller
          return { success: false, data: created, error: String(err) };
        }
      }

      // No external provider requested — return created DB record
      return { success: true, data: created };
    } catch (error) {
      this.logger.error('Failed to create payment', error as any);
      throw new InternalServerErrorException('Failed to create payment');
    }
  }

  /**
   * Return payments for a user ordered by newest first.
   */
  async getPaymentsByUser(userId: number) {
    try {
      this.logger.log(`getPaymentsByUser: user=${userId}`);
      const payments = await this.prisma.payment.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
      this.logger.log(`getPaymentsByUser: found=${payments?.length ?? 0} for user=${userId}`);
      return payments;
    } catch (error) {
      this.logger.error(`Failed to fetch payments for user=${userId}`, error as any);
      throw new InternalServerErrorException('Failed to fetch payments');
    }
  }

  /**
   * Return a single payment by id.
   */
  async getPaymentById(id: number) {
    try {
      this.logger.log(`getPaymentById: id=${id}`);
      const payment = await this.prisma.payment.findUnique({ where: { id } });
      if (!payment) {
        this.logger.warn(`getPaymentById: Payment ${id} not found`);
        throw new NotFoundException(`Payment ${id} not found`);
      }
      return payment;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to fetch payment id=${id}`, error as any);
      throw new InternalServerErrorException('Failed to fetch payment');
    }
  }

  /**
   * Handle incoming webhook / provider callback.
   *
   * - Normalizes common provider shapes (e.g., Paystack: { event, data: { reference, status } })
   * - Finds the DB record by providerPaymentId/reference
   * - Updates payment status
   * - Credits user slots exactly once when transitioning to a success state
   *
   * Returns { ok: boolean, data?: any }
   */
  async handleWebhook(payload: any, opts?: { provider?: string; signature?: string }) {
    try {
      try {
        this.logger.log(`handleWebhook start: provider=${opts?.provider ?? 'unknown'} payloadKeys=${Object.keys(payload).join(', ')}`);
      } catch (_) {
        this.logger.log('handleWebhook start (could not stringify payload keys)');
      }

      // Normalize common provider webhook shapes
      const providerPaymentId =
        payload.providerPaymentId ??
        payload.id ??
        payload.reference ??
        payload.data?.reference ??
        null;

      const status = payload.status ?? payload?.payment_status ?? payload.data?.status ?? 'unknown';

      if (!providerPaymentId) {
        this.logger.warn('Webhook without providerPaymentId received');
        return { ok: false, reason: 'missing_provider_reference' };
      }

      const existing = await this.prisma.payment.findUnique({ where: { providerPaymentId } as any });
      if (!existing) {
        this.logger.warn(`No DB payment found for providerPaymentId=${providerPaymentId}. Payload keys: ${Object.keys(payload).join(', ')}`);
        return { ok: false, reason: 'not_found' };
      }

      const newStatusNormalized = String(status ?? '').toLowerCase();
      const wasSuccess = String(existing.status ?? '').toLowerCase().includes('success');
      const nowSuccess = newStatusNormalized.includes('success') || newStatusNormalized === 'successful' || newStatusNormalized === 'completed';

      // Transaction to update payment and credit slots (if needed) atomically
      const updated = await this.prisma.$transaction(async (tx) => {
        const metadata = (existing.metadata as any) ?? {};
        const alreadyCredited = Boolean(metadata.slotsCredited);

        const newMetadata: any = { ...metadata, webhookHandledAt: new Date().toISOString(), lastWebhookStatus: status };

        // If we transition from non-success -> success and slotsGranted > 0 and not already credited, credit them.
        if (!wasSuccess && nowSuccess && (existing.slotsGranted ?? 0) > 0 && !alreadyCredited) {
          this.logger.log(`Crediting slots: userId=${existing.userId} slots=${existing.slotsGranted} paymentId=${existing.id}`);
          await tx.user.update({
            where: { id: existing.userId },
            data: { availableSlots: { increment: existing.slotsGranted } } as any,
          });
          newMetadata.slotsCredited = true;
        }

        const updatedPayment = await tx.payment.update({
          where: { id: existing.id },
          data: { status, metadata: newMetadata } as any,
        });

        return updatedPayment;
      });

      try {
        this.logger.log(`handleWebhook completed: paymentId=${updated.id} newStatus=${updated.status}`);
      } catch (_) {
        this.logger.log('handleWebhook completed (could not stringify updated result)');
      }

      return { ok: true, data: updated };
    } catch (error) {
      this.logger.error('Error handling payment webhook', error as any);
      throw new InternalServerErrorException('Webhook handling failed');
    }
  }
}
