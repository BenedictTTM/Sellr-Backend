import { IsNumber, IsOptional, IsString, IsObject } from 'class-validator';

export class CreatePaymentDto {
  @IsNumber()
  userId!: number;

  @IsNumber()
  amount!: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
