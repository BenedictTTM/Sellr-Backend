import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { PaystackService } from './paystack.service';

@Module({
  imports: [PrismaModule],
  providers: [PaymentService, PaystackService],
  controllers: [PaymentController],
  exports: [PaymentService],
})
export class PaymentModule {}
