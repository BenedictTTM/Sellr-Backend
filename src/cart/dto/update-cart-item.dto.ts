import { IsInt, IsPositive, Min } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO for updating cart item quantity
 * Ensures quantity is within valid range
 */
export class UpdateCartItemDto {
  /**
   * New quantity for the cart item
   * @example 3
   */
  @IsInt({ message: 'Quantity must be an integer' })
  @Min(1, { message: 'Quantity must be at least 1' })
  @Type(() => Number)
  quantity: number;
}
