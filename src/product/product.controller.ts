import { Controller, Get, Post, Put, Delete, Body, Param, Query, ParseIntPipe , Request } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductDto } from './dto/product.dto';


@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}
  

  @Post()
  async createProduct(@Body() productData: ProductDto, @Request() req) {
    const userId = req.user?.id; // This will now have the actual user ID
    console.log('User ID from token:', userId); // Debug log
    return this.productService.createProduct(productData, userId);
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
    @Param('id') id: string, 
    @Body() productData: ProductDto, 
    @Request() req
  ) {
    const userId = req.user?.id || 1; // Extract from JWT token or use default for testing
    return this.productService.updateProduct(+id, productData, userId);
  }

  @Delete(':id')
  async deleteProduct(@Param('id') id: string, @Request() req) {
    const userId = req.user?.id || 1; // Extract from JWT token or use default for testing
    return this.productService.deleteProduct(+id, userId);
  }
}