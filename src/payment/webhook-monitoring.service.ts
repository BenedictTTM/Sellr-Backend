import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WebhookMonitoringService {
  private readonly logger = new Logger(WebhookMonitoringService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Log webhook events for monitoring and debugging
   */
  async logWebhookEvent(payload: any, status: 'success' | 'failed', error?: string) {
    try {
      const logData = {
        payload: JSON.stringify(payload),
        status,
        error,
        timestamp: new Date(),
      };

      // Log to console for immediate visibility
      if (status === 'success') {
        this.logger.log(`Webhook processed successfully: ${JSON.stringify(logData)}`);
      } else {
        this.logger.error(`Webhook processing failed: ${JSON.stringify(logData)}`);
      }

      // In production, you might want to store these in a dedicated table
      // or send to an external monitoring service like DataDog, New Relic, etc.
      
    } catch (err) {
      this.logger.error('Failed to log webhook event', err);
    }
  }

  /**
   * Check for stuck payments that haven't received webhooks
   */
  async checkStuckPayments() {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    const stuckPayments = await this.prisma.payment.findMany({
      where: {
        status: 'pending',
        createdAt: { lt: fiveMinutesAgo },
      },
      include: {
        user: { select: { email: true } }
      }
    });

    if (stuckPayments.length > 0) {
      this.logger.warn(`Found ${stuckPayments.length} payments pending for over 5 minutes`, 
        stuckPayments.map(p => ({ id: p.id, userEmail: p.user.email, createdAt: p.createdAt }))
      );
    }

    return stuckPayments;
  }
}