import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  InternalServerErrorException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ProductDto } from '../dto/product.dto';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { MeiliSearchService } from '../../meilisearch/meilisearch.service';

@Injectable()
export class CrudService {
  private readonly logger = new Logger(CrudService.name);

  constructor(
    private prisma: PrismaService,
    private cloudinaryService: CloudinaryService,
    private meilisearchService: MeiliSearchService,
  ) {}

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
const newProduct = await this.prisma.$transaction(async (prisma) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new NotFoundException(`User with ID ${userId} not found`);
  }

  if ((user.availableSlots ?? 0) <= 0) {
    throw new BadRequestException('No available product slots for this user');
  }

  const created = await prisma.product.create({
    data: {
      title: productDataWithoutUser.title,
      description: productDataWithoutUser.description,
      originalPrice: productDataWithoutUser.originalPrice,
      discountedPrice: productDataWithoutUser.discountedPrice,
      category: productDataWithoutUser.category,
      imageUrl: imageUrls,
      isActive: true,
      isSold: false,
  condition: (productDataWithoutUser as any).condition ?? '',
      tags: productDataWithoutUser.tags ?? [],
      locationLat: productDataWithoutUser.locationLat ?? 0.0,
      locationLng: productDataWithoutUser.locationLng ?? 0.0,
      stock: productDataWithoutUser.stock ?? 0,
      views: productDataWithoutUser.views ?? 0,
      user: { connect: { id: userId } },
    },
  });

  await prisma.user.update({
    where: { id: userId },
    data: { availableSlots: { decrement: 1 }, usedSlots: { increment: 1 } },
  });

  return created;
});
      // Index the product in MeiliSearch
      try {
        await this.meilisearchService.indexProduct(newProduct);
        this.logger.log(`✅ Product ${newProduct.id} indexed in MeiliSearch`);
      } catch (searchError) {
        this.logger.error(`⚠️ Failed to index product in MeiliSearch: ${searchError.message}`);
        // Don't fail the request if search indexing fails
      }
      
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

      // Update in MeiliSearch
      try {
        await this.meilisearchService.updateProduct(productId, updated);
        this.logger.log(`✅ Product ${productId} updated in MeiliSearch`);
      } catch (searchError) {
        this.logger.error(`⚠️ Failed to update product in MeiliSearch: ${searchError.message}`);
      }

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

      // Update in MeiliSearch (mark as inactive)
      try {
        await this.meilisearchService.updateProduct(productId, softDeleted);
        this.logger.log(`✅ Product ${productId} marked inactive in MeiliSearch`);
      } catch (searchError) {
        this.logger.error(`⚠️ Failed to update product in MeiliSearch: ${searchError.message}`);
      }

      return { success: true, data: softDeleted };
    } catch (error) {
      throw new InternalServerErrorException('Failed to delete product');
    }
  }
}
