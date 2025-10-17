import { IsInt, IsPositive, Min } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO for adding an item to the cart
 * Validates product ID and quantity with proper constraints
 */
export class AddToCartDto {
  /**
   * Product ID to add to cart
   * @example 1
   */
  @IsInt({ message: 'Product ID must be an integer' })
  @IsPositive({ message: 'Product ID must be positive' })
  @Type(() => Number)
  productId: number;

  /**
   * Quantity of the product to add
   * @example 2
   * @default 1
   */
  @IsInt({ message: 'Quantity must be an integer' })
  @Min(1, { message: 'Quantity must be at least 1' })
  @Type(() => Number)
  quantity: number = 1;
}
