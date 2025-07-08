import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ProductDto } from '../dto/product.dto';

@Injectable()
export class GetProductsService {
  constructor(private prisma: PrismaService) {}

  async getAllProducts() {
    const products = await this.prisma.product.findMany({
      where: { isActive: true },
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
    });

    return products.map(product => ({
      ...product,
      averageRating: this.calculateAverageRating(product.reviews),
      totalReviews: product._count.reviews,
      ratingDistribution: this.getRatingDistribution(product.reviews),
    }));
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

  async getProductsByCategory(category: string) {
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

    return products.map(product => ({
      ...product,
      averageRating: this.calculateAverageRating(product.reviews),
      totalReviews: product._count.reviews,
    }));
  }

  async getProductsByUserId(userId: number) {
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

    return products.map(product => ({
      ...product,
      averageRating: this.calculateAverageRating(product.reviews),
      totalReviews: product._count.reviews,
    }));
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
        price: true,
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
        price: 'asc',
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