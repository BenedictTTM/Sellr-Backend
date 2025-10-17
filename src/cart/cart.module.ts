import { Module } from '@nestjs/common';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';
import { PrismaModule } from '../prisma/prisma.module';

/**
 * CartModule
 * 
 * Module for shopping cart functionality.
 * Encapsulates cart-related services, controllers, and dependencies.
 * 
 * Imports:
 * - PrismaModule: Database access for cart operations
 * 
 * Providers:
 * - CartService: Business logic for cart operations
 * 
 * Controllers:
 * - CartController: REST API endpoints
 * 
 * Exports:
 * - CartService: Available for other modules (e.g., OrderModule)
 * 
 * @module
 * @since 1.0.0
 */
@Module({
  imports: [PrismaModule],
  controllers: [CartController],
  providers: [CartService],
  exports: [CartService],
})
export class CartModule {}
