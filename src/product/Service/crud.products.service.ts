import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ProductDto } from '../dto/product.dto';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';

@Injectable()
export class CrudService {
  constructor(private prisma: PrismaService, private cloudinaryService: CloudinaryService) {}

  async uploadImageToCloudinary(file: Express.Multer.File) {
    return await this.cloudinaryService.uploadImage(file).catch(() => {
      throw new BadRequestException('Invalid file type.');
    });
  }

  async createProduct(productData: ProductDto, userId: number, files?: Express.Multer.File[]) {
    try {
      const { userId: _, ...productDataWithoutUser } = productData;
      
      let imageUrls: string[] = [];
      
    // Upload images to Cloudinary if files are provided
    if (files && files.length > 0) {
      const uploadResults = await Promise.all(
        files.map(file => this.uploadImageToCloudinary(file))
      );
      imageUrls = uploadResults.map(result => result.secure_url);
    }

        console.log('📋 Product data before saving:', {
      ...productDataWithoutUser,
      originalPrice: productDataWithoutUser.originalPrice,
      discountedPrice: productDataWithoutUser.discountedPrice,      
      imageUrls,
      userId
    });

 const newProduct = await this.prisma.product.create({
      data: {
        title: productDataWithoutUser.title,
        description: productDataWithoutUser.description,
        originalPrice: productDataWithoutUser.originalPrice, // <-- add this
        discountedPrice: productDataWithoutUser.discountedPrice, // <-- add this
        category: productDataWithoutUser.category,
        imageUrl: imageUrls ,// Default to empty string if no images
        isActive: true,
        isSold: false,
        condition: '',
        tags: productDataWithoutUser.tags || [],
        locationLat: productDataWithoutUser.locationLat || 0.0,
        locationLng: productDataWithoutUser.locationLng || 0.0,
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

  // ...existing updateProduct and deleteProduct methods...

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
