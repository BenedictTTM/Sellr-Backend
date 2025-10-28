import { Controller, Post, Body, Param, Get } from '@nestjs/common';
import { SlotService } from './slot.service';
import { CreateSlotDto } from './dto/create-slot.dto';

@Controller('slots')
export class SlotController {
  constructor(private readonly slotService: SlotService) {}

  // Purchase slots (returns payment initialization/authorization data)
  @Post('purchase')
  async purchase(@Body() body: CreateSlotDto) {
    const { userId, slots } = body;
    return this.slotService.purchaseSlots(userId, slots);
  }

  // Check payment status (useful for frontend to verify payment completion)
  @Get('payment-status/:paymentId')
  async checkPaymentStatus(@Param('paymentId') paymentId: string) {
    return this.slotService.getPaymentStatus(Number(paymentId));
  }

  // Admin / test endpoint to directly credit slots to a user
  @Post('credit')
  async credit(@Body() body: CreateSlotDto) {
    const { userId, slots } = body;
    return this.slotService.creditSlots(userId, slots);
  }

  @Get(':userId')
  async getSlots(@Param('userId') userId: string) {
    return this.slotService.getUserSlots(Number(userId));
  }
}
