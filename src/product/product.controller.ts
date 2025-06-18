import { Controller, Get, Post, Put, Delete, Body, Param, Query, ParseIntPipe } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductDto } from './dto/product.dto';

@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  async createProduct(@Body() productData: ProductDto) {
    return await this.productService.createProduct(productData);
  }

  @Get()
  async getAllProducts() {
    return await this.productService.getAllProducts();
  }

  @Get('search')
  async searchProducts(@Query('q') query: string) {
    return await this.productService.searchProducts(query);
  }

  @Get('category/:category')
  async getProductsByCategory(@Param('category') category: string) {
    return await this.productService.getProductsByCategory(category);
  }

  @Get('user/:userId')
  async getProductsByUserId(@Param('userId', ParseIntPipe) userId: number) {
    return await this.productService.getProductsByUserId(userId);
  }

  @Get(':id')
  async getProductById(@Param('id', ParseIntPipe) productId: number) {
    return await this.productService.getProductById(productId);
  }

  @Put(':id')
  async updateProduct(
    @Param('id', ParseIntPipe) productId: number,
    @Body() productData: ProductDto
  ) {
    return await this.productService.updateProduct(productId, productData);
  }

  @Delete(':id')
  async deleteProduct(@Param('id', ParseIntPipe) productId: number) {
    return await this.productService.deleteProduct(productId);
  }
}