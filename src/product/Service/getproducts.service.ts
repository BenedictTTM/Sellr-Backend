import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ProductDto } from '../dto/product.dto';

@Injectable()
export class GetProductsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Fetch all active products from the database.
   */
  async getAllProducts() {
    return this.prisma.product.findMany({
      where: { 
        isActive: true,
      },
      select: {
        id: true,
        title: true,
        description: true,
        imageUrl: true,
        category: true,
        price: true,
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
          take: 5, // Latest 5 reviews
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

  /**
   * Get a single product by its ID with full details.
   */
  async getProductById(productId: number) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        title: true,
        description: true,
        imageUrl: true,
        category: true,
        price: true,
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
            phone: true, // For contact
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

    // Increment view count
    await this.prisma.product.update({
      where: { id: productId },
      data: { views: { increment: 1 } },
    });

    return product;
  }

  /**
   * Search for products based on a search term.
   */
  async searchProducts(searchTerm: string) {
    try {
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
          price: true,
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
          }

        },
        orderBy: { createdAt: 'desc' },
      });

      return products;
    } catch (error) {
      throw new Error(
        error instanceof Error
          ? error.message
          : 'Unknown error occurred during product search',
      );
    }
  }

  /**
   * Get all active products that belong to a specific category.
   */
  async getProductsByCategory(category: string) {
    try {
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
          price: true,
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
          _count: {
            select: {

            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return products;
    } catch (error) {
      throw new Error(
        error instanceof Error
          ? error.message
          : 'Unknown error occurred during category filtering',
      );
    }
  }

  /**
   * Get all active products posted by a specific user.
   */
  async getProductsByUserId(userId: number) {
    try {
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
          price: true,
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

      return products;
    } catch (error) {
      throw new Error(
        error instanceof Error
          ? error.message
          : 'Unknown error occurred while fetching products by user ID',
      );
    }
  }

  /**
   * Get products by condition (new, used, etc.)
   */
  async getProductsByCondition(condition: string) {
    try {
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
          price: true,
          condition: true,
          createdAt: true,
          user: {
            select: {
              username: true,
              rating: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    } catch (error) {
      throw new Error('Error fetching products by condition');
    }
  }

  /**
   * Get products within a price range
   */
  async getProductsByPriceRange(minPrice: number, maxPrice: number) {
    try {
      return await this.prisma.product.findMany({
        where: {
          price: {
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
          price: true,
          condition: true,
          createdAt: true,
          user: {
            select: {
              username: true,
              rating: true,
            },
          },
        },
        orderBy: {
          price: 'asc',
        },
      });
    } catch (error) {
      throw new Error('Error fetching products by price range');
    }
  }

  /**
   * Get featured/premium products
   */
  async getFeaturedProducts() {
    try {
      return await this.prisma.product.findMany({
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
          price: true,
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
          _count: {
            select: {
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
    } catch (error) {
      throw new Error('Error fetching featured products');
    }
  }
}