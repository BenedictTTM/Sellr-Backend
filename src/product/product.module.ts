import { Module } from '@nestjs/common';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { CrudService } from './Service/crud.products.service';
import { GetProductsService } from './Service/getproducts.service';
import { PrismaModule } from '../prisma/prisma.module'; // Adjust path as needed
import { AuthGuard } from '../guards/auth.guard'; // Adjust path as needed
import { RolesGuard } from '../guards/roles.guard'; // Adjust path as needed
import { AuthModule } from 'src/auth/auth.module'; // Adjust the import path as necessary

@Module({
  imports: [PrismaModule , AuthModule], // Import PrismaModule if your services use Prisma
  controllers: [ProductController],
  providers: [
    ProductService,
    CrudService,
    GetProductsService,
    AuthGuard, 
    RolesGuard
  ],
  exports: [ProductService] // Export if other modules need to use ProductService
})
export class ProductModule {}