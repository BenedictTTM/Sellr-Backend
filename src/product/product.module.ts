import { Module } from '@nestjs/common';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { CrudService } from './Service/crud.products.service';
import { GetProductsService } from './Service/getproducts.service';
import { PrismaModule } from '../prisma/prisma.module'; // Adjust path as needed

@Module({
  imports: [PrismaModule], // Import PrismaModule if your services use Prisma
  controllers: [ProductController],
  providers: [
    ProductService,
    CrudService,
    GetProductsService
  ],
  exports: [ProductService] // Export if other modules need to use ProductService
})
export class ProductModule {}