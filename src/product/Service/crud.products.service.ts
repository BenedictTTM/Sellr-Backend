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

  async createProduct(productData: ProductDto, userId: number, file?: Express.Multer.File) {
    try {
      const { userId: _, ...productDataWithoutUser } = productData;
      
      let imageUrl = '';
      
      // Upload image to Cloudinary if file is provided
      if (file) {
        const uploadResult = await this.uploadImageToCloudinary(file);
        imageUrl = uploadResult.secure_url;
      }

        console.log('📋 Product data before saving:', {
      ...productDataWithoutUser,
      price: productData.price,
      imageUrl,
      userId
    });

 const newProduct = await this.prisma.product.create({
      data: {
        title: productDataWithoutUser.title,
        description: productDataWithoutUser.description,
        price: productDataWithoutUser.price, // Make sure price is included
        category: productDataWithoutUser.category,
        imageUrl,
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
