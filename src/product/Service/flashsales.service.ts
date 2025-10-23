import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';

export interface FlashSaleProduct {
  id: number;
  title: string;
  description: string | null;
  originalPrice: number;
  discountedPrice: number;
  discountPercentage: number;
  category: string;
  imageUrl: string[];
  stock: number;
  views: number;
  tags: string[];
  createdAt: Date;
  user: {
    id: number;
    username: string;
    storeName: string | null;
  };
}

export interface FlashSaleResponse {
  products: FlashSaleProduct[];
  nextRefreshAt: Date;
  refreshesIn: number; // milliseconds until next refresh
}

@Injectable()
export class FlashSalesService {
  private readonly logger = new Logger(FlashSalesService.name);
  private cachedFlashSales: FlashSaleProduct[] = [];
  private nextRefreshTime: Date;

  constructor(private prisma: PrismaService) {
    // Initialize on startup
    this.refreshFlashSales();
  }

  /**
   * Cron job that runs every hour to refresh flash sales
   * Runs at the start of every hour (0 minutes, 0 seconds)
   */
  @Cron(CronExpression.EVERY_HOUR)
  async handleHourlyRefresh() {
    this.logger.log('🔄 Hourly flash sales refresh triggered');
    await this.refreshFlashSales();
  }

  /**
   * Calculate discount percentage
   */
  private calculateDiscount(originalPrice: number, discountedPrice: number): number {
    if (originalPrice <= 0) return 0;
    return Math.round(((originalPrice - discountedPrice) / originalPrice) * 100);
  }

  /**
   * Refresh flash sales by fetching new products
   */
  async refreshFlashSales(): Promise<void> {
    try {
      this.logger.log('🔍 Fetching products for flash sales...');

      // Get all active products with stock and not sold
      const products = await this.prisma.product.findMany({
        where: {
          isActive: true,
          isSold: false,
          stock: {
            gt: 0,
          },
          originalPrice: {
            gt: 0,
          },
          discountedPrice: {
            gt: 0,
          },
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              storeName: true,
            },
          },
        },
      });

      // Filter products with 30-70% discount
      const eligibleProducts = products
        .map((product) => {
          const discountPercentage = this.calculateDiscount(
            product.originalPrice,
            product.discountedPrice,
          );
          return { ...product, discountPercentage };
        })
        .filter(
          (product) =>
            product.discountPercentage >= 30 && product.discountPercentage <= 70,
        );

      this.logger.log(
        `✅ Found ${eligibleProducts.length} eligible products for flash sales`,
      );

      // Shuffle and take 20 random products
      const shuffled = this.shuffleArray(eligibleProducts);
      this.cachedFlashSales = shuffled.slice(0, 20).map((product) => ({
        id: product.id,
        title: product.title,
        description: product.description,
        originalPrice: product.originalPrice,
        discountedPrice: product.discountedPrice,
        discountPercentage: product.discountPercentage,
        category: product.category,
        imageUrl: product.imageUrl,
        stock: product.stock,
        views: product.views,
        tags: product.tags,
        createdAt: product.createdAt,
        user: product.user,
      }));

      // Set next refresh time to the start of next hour
      this.nextRefreshTime = this.getNextHourStart();

      this.logger.log(
        `🎉 Flash sales refreshed with ${this.cachedFlashSales.length} products. Next refresh at ${this.nextRefreshTime.toISOString()}`,
      );
    } catch (error) {
      this.logger.error(`❌ Error refreshing flash sales: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get current flash sales products
   */
  async getFlashSales(): Promise<FlashSaleResponse> {
    // If cache is empty, refresh
    if (this.cachedFlashSales.length === 0) {
      await this.refreshFlashSales();
    }

    const now = new Date();
    const refreshesIn = this.nextRefreshTime.getTime() - now.getTime();

    return {
      products: this.cachedFlashSales,
      nextRefreshAt: this.nextRefreshTime,
      refreshesIn: Math.max(0, refreshesIn),
    };
  }

  /**
   * Fisher-Yates shuffle algorithm for randomization
   */
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Get the start of the next hour
   */
  private getNextHourStart(): Date {
    const next = new Date();
    next.setHours(next.getHours() + 1, 0, 0, 0);
    return next;
  }

  /**
   * Manual refresh endpoint (for admin/testing purposes)
   */
  async forceRefresh(): Promise<FlashSaleResponse> {
    this.logger.log('🔄 Manual flash sales refresh triggered');
    await this.refreshFlashSales();
    return this.getFlashSales();
  }
}
