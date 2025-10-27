import { Injectable, Logger } from '@nestjs/common';
import crypto from 'crypto';

@Injectable()
export class PaystackService {
  private readonly logger = new Logger(PaystackService.name);
  private readonly secret = process.env.PAYSTACK_SECRET_KEY;
  private readonly baseUrl = 'https://api.paystack.co';

  /** Initialize a transaction on Paystack
   * amount should be in the main currency units (e.g. GHS). We'll convert to smallest unit by *100.
   */
  async initializeTransaction(email: string, amount: number, reference: string, callbackUrl?: string) {
    const url = `${this.baseUrl}/transaction/initialize`;
    const body = {
      email,
      amount: Math.round(amount * 100), // convert to smallest currency unit
      reference,
      callback_url: callbackUrl ?? process.env.PAYSTACK_CALLBACK_URL,
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.secret}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (!res.ok) {
      this.logger.error('Paystack initialize failed', data);
      throw new Error(data?.message || 'Paystack initialization failed');
    }

    // returns { authorization_url, access_code, reference }
    return data.data;
  }

  async verifyTransaction(reference: string) {
    const url = `${this.baseUrl}/transaction/verify/${encodeURIComponent(reference)}`;
    const res = await fetch(url, {
      method: 'GET',
      headers: { Authorization: `Bearer ${this.secret}` },
    });
    const data = await res.json();
    if (!res.ok) {
      this.logger.error('Paystack verify failed', data);
      throw new Error(data?.message || 'Paystack verify failed');
    }
    return data.data;
  }

  /** Verify Paystack webhook signature. Paystack sends HMAC-SHA512 of raw body using secret. */
  verifySignature(rawBody: string, signatureHeader?: string | null) {
    if (!this.secret) {
      this.logger.warn('PAYSTACK_SECRET_KEY not set; cannot verify signature');
      return false;
    }
    if (!signatureHeader) return false;
    const hash = crypto.createHmac('sha512', this.secret).update(rawBody).digest('hex');
    return hash === signatureHeader;
  }
}
