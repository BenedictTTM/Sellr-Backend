import { Controller, Post, Body, Get, Param, HttpCode, HttpStatus, Req, Res, Logger } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { Request, Response } from 'express';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaystackService } from './paystack.service';

@Controller('payments')
export class PaymentController {
  private readonly logger = new Logger(PaymentController.name);

  constructor(
    private readonly paymentService: PaymentService, 
    private readonly paystackService: PaystackService
  ) {}

  @Post()
  async create(@Body() body: CreatePaymentDto) {
    const { userId, amount, currency = 'GHS', metadata } = body;
    const result = await this.paymentService.createPayment(userId, amount, currency, metadata);
    return result;
  }

  @Get('user/:id')
  async getByUser(@Param('id') id: string) {
    const userId = Number(id);
    return this.paymentService.getPaymentsByUser(userId);
  }
  
  @Get(':id')
  async getById(@Param('id') id: string) {
    const paymentId = Number(id);
    return this.paymentService.getPaymentById(paymentId);
  }

  /**
   * Verify a payment by reference
   * This endpoint can be called by the frontend after Paystack redirect
   */
  @Post('verify')
  async verifyPayment(@Body() body: { reference: string }) {
    const { reference } = body;
    
    if (!reference) {
      return { success: false, error: 'Payment reference is required' };
    }

    try {
      // Verify with Paystack
      const verification = await this.paystackService.verifyTransaction(reference);
      
      // Update our database via webhook handler
      await this.paymentService.handleWebhook({
        providerPaymentId: reference,
        status: verification.status,
        data: verification,
      });

      return {
        success: true,
        status: verification.status,
        amount: verification.amount / 100, // Convert from kobo/pesewas to main currency
        reference: verification.reference,
      };
    } catch (error) {
      this.logger.error('Payment verification failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Verification failed',
      };
    }
  }


  // Enhanced webhook endpoint with proper monitoring
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async webhook(@Req() req: Request, @Res() res: Response) {
    const signature = (req.headers['x-paystack-signature'] as string) || null;
    const rawBody = (req as any).rawBody ?? JSON.stringify(req.body);
    const payload = req.body;

    try {
      this.logger.log(`Webhook received: ${JSON.stringify({ 
        hasSignature: !!signature, 
        payloadKeys: Object.keys(payload),
        nodeEnv: process.env.NODE_ENV || 'undefined'
      })}`);

      // Signature validation
      const isProduction = process.env.NODE_ENV === 'production';
      const valid = this.paystackService.verifySignature(rawBody, signature);
      
      this.logger.log(`Signature validation: valid=${valid}, isProduction=${isProduction}`);
      
      if (!valid) {
        this.logger.warn('Webhook signature validation failed');
        
        if (isProduction) {
          return res.status(400).json({ ok: false, message: 'invalid signature' });
        } else {
          this.logger.warn('⚠️  Webhook received without valid signature (development mode - proceeding anyway)');
          // Continue processing in development mode
        }
      }

      // Process webhook
      const data = payload?.data ?? payload;
      const providerPaymentId = data?.reference ?? data?.id ?? null;
      const status = data?.status ?? payload?.status ?? 'unknown';

      this.logger.log(`Processing webhook: reference=${providerPaymentId}, status=${status}`);

      if (!providerPaymentId) {
        this.logger.warn('Webhook missing payment reference');
        return res.status(400).json({ ok: false, message: 'missing payment reference' });
      }

      const result = await this.paymentService.handleWebhook({ providerPaymentId, status });
      
      this.logger.log(`Webhook processed successfully: paymentRef=${providerPaymentId} status=${status} result=${JSON.stringify(result)}`);
      return res.status(200).json(result);

    } catch (err) {
      this.logger.error('Webhook processing error:', err);
      return res.status(500).json({ ok: false, error: String(err) });
    }
  }
}
