import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service'; // Adjust path as necessary
import { ProductDto } from '../dto/product.dto'; // If needed for create/update in future

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Fetch all active products from the database.
   */
  async getAllProducts() {
    return this.prisma.product.findMany({
      where: { isActive: true },
      select: {
        id: true,
        title: true,
        price: true,
        createdAt: true,
        category: true,
        isActive: true,
        description: true,
        imageUrl: true,
      },
    });
  }

  /**
   * Get a single product by its ID.
   * Throws NotFoundException if not found.
   */
  async getProductById(productId: number) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        title: true,
        price: true,
        createdAt: true,
        category: true,
        isActive: true,
        description: true,
        imageUrl: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    return product;
  }

  /**
   * Search for products based on a search term.
   * Matches title, description, or category (case-insensitive).
   */
  async searchProducts(searchTerm: string) {
    try {
      const products = await this.prisma.product.findMany({
        where: {
          AND: [
            { isActive: true },
            {
              OR: [
                { title: { contains: searchTerm, mode: 'insensitive' } },
                { description: { contains: searchTerm, mode: 'insensitive' } },
                { category: { contains: searchTerm, mode: 'insensitive' } },
              ],
            },
          ],
        },
        select: {
          id: true,
          title: true,
          price: true,
          createdAt: true,
          category: true,
          isActive: true,
          description: true,
          imageUrl: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      return products;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Unknown error occurred during product search');
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
        },
        select: {
          id: true,
          title: true,
          price: true,
          createdAt: true,
          category: true,
          isActive: true,
          description: true,
          imageUrl: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return products;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Unknown error occurred during category filtering');
    }
  }
}
