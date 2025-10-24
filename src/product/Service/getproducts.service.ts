import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ProductDto } from '../dto/product.dto';
import { MeiliSearchService } from '../../meilisearch/meilisearch.service';

@Injectable()
export class GetProductsService {
  private readonly logger = new Logger(GetProductsService.name);

  constructor(
    private prisma: PrismaService,
    private meilisearchService: MeiliSearchService,
  ) {}

  async getAllProducts(page: number = 1, limit: number = 20) {
    // Validate and sanitize inputs
    const validatedPage = Math.max(1, page);
    const validatedLimit = Math.min(Math.max(1, limit), 100); // Max 100 items per page
    const skip = (validatedPage - 1) * validatedLimit;

    // Get total count for pagination metadata
    const totalCount = await this.prisma.product.count({
      where: { isActive: true },
    });

    const products = await this.prisma.product.findMany({
      where: { isActive: true },
      select: {
        id: true,
        title: true,
        description: true,
        imageUrl: true,
        category: true,
        originalPrice: true,
        discountedPrice: true,
        stock: true,
        condition: true,
        tags: true,
        views: true,
        locationLat: true,
        locationLng: true,
        createdAt: true,
        updatedAt: true,
        isActive: true,
        isSold: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePic: true,
            rating: true,
            totalRatings: true,
            premiumTier: true,
          },
        },
        images: {
          select: {
            id: true,
            url: true,
          },
        },
        delivery: {
          select: {
            id: true,
            method: true,
            location: true,
            fee: true,
          },
        },
        reviews: {
          select: {
            id: true,
            rating: true,
            comment: true,
            createdAt: true,
            reviewer: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 5,
        },
        _count: {
          select: {
            reviews: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: validatedLimit,
    });

    const totalPages = Math.ceil(totalCount / validatedLimit);

    return {
      data: products.map(product => ({
        ...product,
        averageRating: this.calculateAverageRating(product.reviews),
        totalReviews: product._count.reviews,
        ratingDistribution: this.getRatingDistribution(product.reviews),
      })),
      pagination: {
        page: validatedPage,
        limit: validatedLimit,
        totalCount,
        totalPages,
        hasNextPage: validatedPage < totalPages,
        hasPreviousPage: validatedPage > 1,
      },
    };
  }

  async getProductById(productId: number) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        title: true,
        description: true,
        imageUrl: true,
        category: true,
        originalPrice: true,
        discountedPrice: true,
        stock: true,
        condition: true,
        tags: true,
        views: true,
        locationLat: true,
        locationLng: true,
        createdAt: true,
        updatedAt: true,
        isActive: true,
        isSold: true,
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            profilePic: true,
            rating: true,
            totalRatings: true,
            premiumTier: true,
            phone: true,
          },
        },
        images: {
          select: {
            id: true,
            url: true,
          },
          orderBy: {
            id: 'asc',
          },
        },
        delivery: {
          select: {
            id: true,
            method: true,
            location: true,
            fee: true,
          },
        },
        reviews: {
          select: {
            id: true,
            rating: true,
            comment: true,
            createdAt: true,
            reviewer: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                profilePic: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        _count: {
          select: {
            reviews: true,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    await this.prisma.product.update({
      where: { id: productId },
      data: { views: { increment: 1 } },
    });

    return {
      ...product,
      averageRating: this.calculateAverageRating(product.reviews),
      totalReviews: product._count.reviews,
      ratingDistribution: this.getRatingDistribution(product.reviews),
    };
  }

  async searchProducts(searchTerm: string) {
    try {
      // Use MeiliSearch for fast, typo-tolerant search
      this.logger.log(`🔍 Searching with MeiliSearch: "${searchTerm}"`);
      
      const searchResults = await this.meilisearchService.searchProducts(
        searchTerm,
        {
          isActive: true, // Only active products
        },
        {
          limit: 50, // Limit results
        }
      );

      // Get full product details from database for the search results
      const productIds = searchResults.hits.map((hit: any) => hit.id);
      
      if (productIds.length === 0) {
        return [];
      }

      const products = await this.prisma.product.findMany({
        where: {
          id: { in: productIds },
          isActive: true,
        },
        select: {
          id: true,
          title: true,
          description: true,
          imageUrl: true,
          category: true,
          originalPrice: true,
          discountedPrice: true,
          condition: true,
          tags: true,
          views: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              rating: true,
              premiumTier: true,
            },
          },
          images: {
            select: {
              url: true,
            },
            take: 1,
          },
          reviews: {
            select: {
              rating: true,
            },
          },
          _count: {
            select: {
              reviews: true,
            },
          },
        },
      });

      // Maintain MeiliSearch relevance order
      const orderedProducts = productIds
        .map(id => products.find(p => p.id === id))
        .filter(p => p !== undefined);

      this.logger.log(`✅ Found ${orderedProducts.length} products via MeiliSearch`);

      return orderedProducts.map(product => ({
        ...product,
        averageRating: this.calculateAverageRating(product.reviews),
        totalReviews: product._count.reviews,
      }));
    } catch (error) {
      // Fallback to database search if MeiliSearch fails
      this.logger.warn(`⚠️ MeiliSearch failed, falling back to database: ${error.message}`);
      
      const products = await this.prisma.product.findMany({
        where: {
          AND: [
            { isActive: true },
            { isSold: false },
            {
              OR: [
                { title: { contains: searchTerm, mode: 'insensitive' } },
                { description: { contains: searchTerm, mode: 'insensitive' } },
                { category: { contains: searchTerm, mode: 'insensitive' } },
                { tags: { has: searchTerm } },
                { condition: { contains: searchTerm, mode: 'insensitive' } },
              ],
            },
          ],
        },
        select: {
          id: true,
          title: true,
          description: true,
          imageUrl: true,
          category: true,
          originalPrice: true,
          discountedPrice: true,
          condition: true,
          tags: true,
          views: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              rating: true,
              premiumTier: true,
            },
          },
          images: {
            select: {
              url: true,
            },
            take: 1,
          },
          reviews: {
            select: {
              rating: true,
            },
          },
          _count: {
            select: {
              reviews: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return products.map(product => ({
        ...product,
        averageRating: this.calculateAverageRating(product.reviews),
        totalReviews: product._count.reviews,
      }));
    }
  }

  async getProductsByCategory(category: string, page: number = 1, limit: number = 20) {
    const validatedPage = Math.max(1, page);
    const validatedLimit = Math.min(Math.max(1, limit), 100);
    const skip = (validatedPage - 1) * validatedLimit;

    const totalCount = await this.prisma.product.count({
      where: {
        category: {
          equals: category,
          mode: 'insensitive',
        },
        isActive: true,
        isSold: false,
      },
    });

    const products = await this.prisma.product.findMany({
      where: {
        category: {
          equals: category,
          mode: 'insensitive',
        },
        isActive: true,
        isSold: false,
      },
      select: {
        id: true,
        title: true,
        description: true,
        imageUrl: true,
        category: true,
        originalPrice: true,
        discountedPrice: true,
        condition: true,
        tags: true,
        views: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            rating: true,
            premiumTier: true,
          },
        },
        images: {
          select: {
            url: true,
          },
          take: 1,
        },
        reviews: {
          select: {
            rating: true,
          },
        },
        _count: {
          select: {
            reviews: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: validatedLimit,
    });

    const totalPages = Math.ceil(totalCount / validatedLimit);

    return {
      data: products.map(product => ({
        ...product,
        averageRating: this.calculateAverageRating(product.reviews),
        totalReviews: product._count.reviews,
      })),
      pagination: {
        page: validatedPage,
        limit: validatedLimit,
        totalCount,
        totalPages,
        hasNextPage: validatedPage < totalPages,
        hasPreviousPage: validatedPage > 1,
      },
    };
  }

  async getProductsByUserId(userId: number, page: number = 1, limit: number = 20) {
    const validatedPage = Math.max(1, page);
    const validatedLimit = Math.min(Math.max(1, limit), 100);
    const skip = (validatedPage - 1) * validatedLimit;

    const totalCount = await this.prisma.product.count({
      where: {
        userId: userId,
        isActive: true,
      },
    });

    const products = await this.prisma.product.findMany({
      where: {
        userId: userId,
        isActive: true,
      },
      select: {
        id: true,
        title: true,
        description: true,
        imageUrl: true,
        category: true,
        originalPrice: true,
        discountedPrice: true,
        stock: true,
        condition: true,
        tags: true,
        views: true,
        isSold: true,
        createdAt: true,
        images: {
          select: {
            url: true,
          },
          take: 1,
        },
        reviews: {
          select: {
            rating: true,
          },
        },
        _count: {
          select: {
            reviews: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: validatedLimit,
    });

    const totalPages = Math.ceil(totalCount / validatedLimit);

    return {
      data: products.map(product => ({
        ...product,
        averageRating: this.calculateAverageRating(product.reviews),
        totalReviews: product._count.reviews,
      })),
      pagination: {
        page: validatedPage,
        limit: validatedLimit,
        totalCount,
        totalPages,
        hasNextPage: validatedPage < totalPages,
        hasPreviousPage: validatedPage > 1,
      },
    };
  }

  async getProductsByCondition(condition: string) {
    return await this.prisma.product.findMany({
      where: {
        condition: {
          equals: condition,
          mode: 'insensitive',
        },
        isActive: true,
        isSold: false,
      },
      select: {
        id: true,
        title: true,
        imageUrl: true,
         originalPrice: true,
        discountedPrice: true,
        condition: true,
        createdAt: true,
        user: {
          select: {
            username: true,
            rating: true,
          },
        },
        reviews: {
          select: {
            rating: true,
          },
        },
        _count: {
          select: {
            reviews: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getProductsByPriceRange(minPrice: number, maxPrice: number) {
    return await this.prisma.product.findMany({
      where: {
        discountedPrice: {
          gte: minPrice,
          lte: maxPrice,
        },
        isActive: true,
        isSold: false,
      },
      select: {
        id: true,
        title: true,
        imageUrl: true,
        originalPrice: true,
        discountedPrice: true,
        condition: true,
        createdAt: true,
        user: {
          select: {
            username: true,
            rating: true,
          },
        },
        reviews: {
          select: {
            rating: true,
          },
        },
        _count: {
          select: {
            reviews: true,
          },
        },
      },
      orderBy: {
        discountedPrice: 'asc',
      },
    });
  }

  async getFeaturedProducts() {
    const products = await this.prisma.product.findMany({
      where: {
        isActive: true,
        isSold: false,
        user: {
          premiumTier: {
            not: 'FREE',
          },
        },
      },
      select: {
        id: true,
        title: true,
        imageUrl: true,
        originalPrice: true,
        discountedPrice: true,
        condition: true,
        views: true,
        createdAt: true,
        user: {
          select: {
            username: true,
            rating: true,
            premiumTier: true,
          },
        },
        reviews: {
          select: {
            rating: true,
          },
        },
        _count: {
          select: {
            reviews: true,
          },
        },
      },
      orderBy: [
        { user: { premiumTier: 'desc' } },
        { views: 'desc' },
        { createdAt: 'desc' },
      ],
      take: 20,
    });

    return products.map(product => ({
      ...product,
      averageRating: this.calculateAverageRating(product.reviews),
      totalReviews: product._count.reviews,
    }));
  }

  // Helper methods
  private calculateAverageRating(reviews: any[]): number {
    if (!reviews || reviews.length === 0) return 0;
    
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return Math.round((sum / reviews.length) * 10) / 10;
  }

  private getRatingDistribution(reviews: any[]): Record<number, number> {
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    
    reviews.forEach(review => {
      if (distribution.hasOwnProperty(review.rating)) {
        distribution[review.rating]++;
      }
    });

    return distribution;
  }
}