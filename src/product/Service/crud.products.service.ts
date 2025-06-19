import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ProductDto } from '../dto/product.dto';

@Injectable()
export class CrudService {
  constructor(private prisma: PrismaService) {}

  async createProduct(productData: ProductDto, userId: number ) {
    try {
    const {userId: _, ...productDataWithoutUser} = productData; // Exclude userId from productData
      const newProduct = await this.prisma.product.create({
        data: {
          ...productDataWithoutUser,
          isActive: true,
          isSold: false,
          condition:'',
        tags: [], // Add empty array for tags
        locationLat: 0.0, // Add default value
        locationLng: 0.0, // Add default value
          stock: 1,
          views: 0,
          user: { connect: { id: userId } },
        },
      });
      return { success: true, data: newProduct };
    } catch (error) {
     
        console.error('Database error:', error);
        throw new InternalServerErrorException(`Failed to create product: ${error.message}`);
     
    }
  }

  async updateProduct(productId: number, productData: ProductDto, userId: number) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) throw new NotFoundException(`Product with ID ${productId} not found`);
    if (product.userId !== userId)
      throw new ForbiddenException('You are not allowed to update this product');
    try {
      const updated = await this.prisma.product.update({
        where: { id: productId },
        data: {
          ...productData,
        },
      });
      return { success: true, data: updated };
    } catch (error) {
       console.error('Database error:', error);
      throw new InternalServerErrorException(`Failed to create product: ${error.message}`);
    }
  }

  async deleteProduct(productId: number, userId: number ) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) throw new NotFoundException(`Product with ID ${productId} not found`);
    if (product.userId !== userId)
      throw new ForbiddenException('You are not allowed to delete this product');

    try {
      const softDeleted = await this.prisma.product.update({
        where: { id: productId },
        data: {
          isActive: false,
        },
      });
      return { success: true, data: softDeleted };
    } catch (error) {
      throw new InternalServerErrorException('Failed to delete product');
    }
  }
}
