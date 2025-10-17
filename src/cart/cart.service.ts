import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AddToCartDto, UpdateCartItemDto } from './dto';

/**
 * CartService
 * 
 * Enterprise-grade shopping cart service following SOLID principles and best practices.
 * Handles all cart operations with proper error handling, transaction safety, and validation.
 * 
 * @class
 * @since 1.0.0
 */
@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Add a product to the user's cart.
   * 
   * Creates a new cart if the user doesn't have one.
   * Updates quantity if product already exists in cart.
   * Validates product existence and stock availability.
   * 
   * @param userId - The authenticated user's ID
   * @param addToCartDto - Product ID and quantity to add
   * @returns The updated cart with all items and product details
   * @throws {NotFoundException} If product doesn't exist
   * @throws {BadRequestException} If insufficient stock or invalid quantity
   * @throws {InternalServerErrorException} If database operation fails
   * 
   * @example
   * ```typescript
   * const cart = await cartService.addToCart(1, { productId: 5, quantity: 2 });
   * ```
   */
  async addToCart(userId: number, addToCartDto: AddToCartDto) {
    const { productId, quantity } = addToCartDto;

    try {
      // Validate product exists and check stock
      const product = await this.prisma.product.findUnique({
        where: { id: productId },
        select: { id: true, title: true, stock: true, originalPrice: true, discountedPrice: true },
      });

      if (!product) {
        throw new NotFoundException(`Product with ID ${productId} not found`);
      }

      if (product.stock < quantity) {
        throw new BadRequestException(
          `Insufficient stock. Only ${product.stock} items available`,
        );
      }

      // Use transaction to ensure atomicity
      const result = await this.prisma.$transaction(async (tx) => {
        // Get or create cart
        let cart = await tx.cart.findUnique({
          where: { userId },
          include: { items: true },
        });

        if (!cart) {
          cart = await tx.cart.create({
            data: { userId },
            include: { items: true },
          });
        }

        // Check if product already in cart
        const existingItem = await tx.cartItem.findUnique({
          where: {
            cartId_productId: {
              cartId: cart.id,
              productId,
            },
          },
        });

        if (existingItem) {
          // Update existing item quantity
          const newQuantity = existingItem.quantity + quantity;

          if (product.stock < newQuantity) {
            throw new BadRequestException(
              `Cannot add ${quantity} more items. Only ${product.stock - existingItem.quantity} items available`,
            );
          }

          await tx.cartItem.update({
            where: { id: existingItem.id },
            data: { quantity: newQuantity },
          });
        } else {
          // Create new cart item
          await tx.cartItem.create({
            data: {
              cartId: cart.id,
              productId,
              quantity,
            },
          });
        }

        // Return updated cart with full details
        return tx.cart.findUnique({
          where: { id: cart.id },
          include: {
            items: {
              include: {
                product: {
                  select: {
                    id: true,
                    title: true,
                    description: true,
                    originalPrice: true,
                    discountedPrice: true,
                    imageUrl: true,
                    stock: true,
                  },
                },
              },
            },
          },
        });
      });

      return this.formatCartResponse(result);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to add item to cart',
        error.message,
      );
    }
  }

  /**
   * Get the user's cart with all items and calculated totals.
   * 
   * Returns null if user has no cart yet.
   * Includes product details, subtotal, and total item count.
   * 
   * @param userId - The authenticated user's ID
   * @returns The cart with items and totals, or null if no cart exists
   * @throws {InternalServerErrorException} If database operation fails
   * 
   * @example
   * ```typescript
   * const cart = await cartService.getCart(1);
   * if (cart) {
   *   console.log(`Total: GHS ${cart.subtotal}`);
   * }
   * ```
   */
  async getCart(userId: number) {
    try {
      const cart = await this.prisma.cart.findUnique({
        where: { userId },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  title: true,
                  description: true,
                  originalPrice: true,
                  discountedPrice: true,
                  imageUrl: true,
                  stock: true,
                },
              },
            },
          },
        },
      });

      if (!cart) {
        return null;
      }

      return this.formatCartResponse(cart);
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to retrieve cart',
        error.message,
      );
    }
  }

  /**
   * Update the quantity of a specific cart item.
   * 
   * Validates stock availability before updating.
   * Automatically removes item if quantity is set to 0.
   * 
   * @param userId - The authenticated user's ID
   * @param itemId - The cart item ID to update
   * @param updateCartItemDto - New quantity value
   * @returns The updated cart with all items and totals
   * @throws {NotFoundException} If cart item doesn't exist or doesn't belong to user
   * @throws {BadRequestException} If insufficient stock
   * @throws {InternalServerErrorException} If database operation fails
   * 
   * @example
   * ```typescript
   * const cart = await cartService.updateCartItem(1, 5, { quantity: 3 });
   * ```
   */
  async updateCartItem(
    userId: number,
    itemId: number,
    updateCartItemDto: UpdateCartItemDto,
  ) {
    const { quantity } = updateCartItemDto;

    try {
      // Verify item exists and belongs to user's cart
      const cartItem = await this.prisma.cartItem.findUnique({
        where: { id: itemId },
        include: {
          cart: { select: { userId: true, id: true } },
          product: { select: { stock: true, title: true } },
        },
      });

      if (!cartItem || cartItem.cart.userId !== userId) {
        throw new NotFoundException('Cart item not found');
      }

      // Validate stock
      if (cartItem.product.stock < quantity) {
        throw new BadRequestException(
          `Insufficient stock for ${cartItem.product.title}. Only ${cartItem.product.stock} items available`,
        );
      }

      // Update quantity
      await this.prisma.cartItem.update({
        where: { id: itemId },
        data: { quantity },
      });

      // Return updated cart
      return this.getCart(userId);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to update cart item',
        error.message,
      );
    }
  }

  /**
   * Remove a specific item from the cart.
   * 
   * Verifies the item belongs to the user's cart before deletion.
   * 
   * @param userId - The authenticated user's ID
   * @param itemId - The cart item ID to remove
   * @returns The updated cart after removal, or null if cart becomes empty
   * @throws {NotFoundException} If cart item doesn't exist or doesn't belong to user
   * @throws {InternalServerErrorException} If database operation fails
   * 
   * @example
   * ```typescript
   * await cartService.removeCartItem(1, 5);
   * ```
   */
  async removeCartItem(userId: number, itemId: number) {
    try {
      // Verify item exists and belongs to user's cart
      const cartItem = await this.prisma.cartItem.findUnique({
        where: { id: itemId },
        include: {
          cart: { select: { userId: true } },
        },
      });

      if (!cartItem || cartItem.cart.userId !== userId) {
        throw new NotFoundException('Cart item not found');
      }

      // Delete the item
      await this.prisma.cartItem.delete({
        where: { id: itemId },
      });

      // Return updated cart
      return this.getCart(userId);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to remove cart item',
        error.message,
      );
    }
  }

  /**
   * Clear all items from the user's cart.
   * 
   * Removes all cart items but keeps the cart entity.
   * Useful for post-checkout cleanup.
   * 
   * @param userId - The authenticated user's ID
   * @returns The empty cart
   * @throws {NotFoundException} If user has no cart
   * @throws {InternalServerErrorException} If database operation fails
   * 
   * @example
   * ```typescript
   * await cartService.clearCart(1);
   * ```
   */
  async clearCart(userId: number) {
    try {
      const cart = await this.prisma.cart.findUnique({
        where: { userId },
      });

      if (!cart) {
        throw new NotFoundException('Cart not found');
      }

      // Delete all items in the cart
      await this.prisma.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      // Return empty cart
      return this.getCart(userId);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to clear cart',
        error.message,
      );
    }
  }

  /**
   * Get the total count of items in the user's cart.
   * 
   * Useful for displaying cart badge in header.
   * Returns 0 if no cart exists.
   * 
   * @param userId - The authenticated user's ID
   * @returns The total quantity of all items in cart
   * @throws {InternalServerErrorException} If database operation fails
   * 
   * @example
   * ```typescript
   * const itemCount = await cartService.getCartItemCount(1);
   * // Display badge: <Badge>{itemCount}</Badge>
   * ```
   */
  async getCartItemCount(userId: number): Promise<number> {
    try {
      const cart = await this.prisma.cart.findUnique({
        where: { userId },
        include: {
          items: {
            select: { quantity: true },
          },
        },
      });

      if (!cart) {
        return 0;
      }

      return cart.items.reduce((total, item) => total + item.quantity, 0);
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to get cart item count',
        error.message,
      );
    }
  }

  /**
   * Format cart response with calculated totals.
   * 
   * Private helper method to ensure consistent response structure.
   * Calculates subtotal, applies discounts, and counts total items.
   * 
   * @private
   * @param cart - Raw cart data from database
   * @returns Formatted cart with totals
   */
  private formatCartResponse(cart: any) {
    if (!cart) return null;

    const items = cart.items.map((item: any) => {
      // Use discountedPrice if available, otherwise use originalPrice
      const effectivePrice = item.product.discountedPrice || item.product.originalPrice;

      return {
        id: item.id,
        quantity: item.quantity,
        product: item.product,
        itemTotal: effectivePrice * item.quantity,
      };
    });

    const subtotal = items.reduce(
      (total: number, item: any) => total + item.itemTotal,
      0,
    );

    const totalItems = items.reduce(
      (total: number, item: any) => total + item.quantity,
      0,
    );

    return {
      id: cart.id,
      userId: cart.userId,
      items,
      subtotal: Number(subtotal.toFixed(2)),
      totalItems,
      createdAt: cart.createdAt,
      updatedAt: cart.updatedAt,
    };
  }
}
