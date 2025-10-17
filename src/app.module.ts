import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProductModule } from './product/product.module'
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { CartModule } from './cart/cart.module';

@Module({
  imports: [AuthModule, UserModule, PrismaModule, ProductModule , CloudinaryModule, CartModule],
  
})

export class AppModule {}
