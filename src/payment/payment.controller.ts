import { Controller, Post, Body, Get, Param, HttpCode, HttpStatus, Req, Res } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { Request, Response } from 'express';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaystackService } from './paystack.service';

@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService, private readonly paystackService: PaystackService) {}

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

  
  // Generic webhook endpoint - validate signatures in production
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async webhook(@Req() req: Request, @Res() res: Response) {
    const signature = (req.headers['x-paystack-signature'] as string) || null;
    const rawBody = (req as any).rawBody ?? JSON.stringify(req.body);

    // verify signature when possible
    const valid = this.paystackService.verifySignature(rawBody, signature);
    if (!valid) {
      return res.status(400).json({ ok: false, message: 'invalid signature' });
    }

    const payload = req.body;
    try {
      // Paystack sends payload.data.reference and payload.data.status
      const data = payload?.data ?? payload;
      const providerPaymentId = data?.reference ?? data?.id ?? null;
      const status = data?.status ?? payload?.status ?? 'unknown';

      const result = await this.paymentService.handleWebhook({ providerPaymentId, status });
      return res.status(200).json(result);
    } catch (err) {
      return res.status(500).json({ ok: false });
    }
  }
}
