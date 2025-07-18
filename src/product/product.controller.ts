import { Controller, Get, Post, Put, Delete, Body, Param, Query, ParseIntPipe , Request , UseGuards } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductDto } from './dto/product.dto';
import { AuthGuard } from '../guards/auth.guard'; // Adjust the import path as necessary
import { FilesInterceptor } from '@nestjs/platform-express';
import { UseInterceptors } from '@nestjs/common';
import { UploadedFiles, ParseFilePipe, MaxFileSizeValidator, FileTypeValidator } from '@nestjs/common';


@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}


@Post()
  @UseGuards(AuthGuard)
  @UseInterceptors(FilesInterceptor('images')) // Add this to handle file upload
  async createProduct(
    @Body() productData: ProductDto, 
    @Request() req,
    @UploadedFiles(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 5MB
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|gif)$/ }),
        ],
        fileIsRequired: false, // Make file optional
      })
    ) files?: Express.Multer.File[] // Add this parameter to receive the uploaded file
  ) {
    const userId = req.user?.id;
    console.log('User ID from token:', userId);
console.log('Uploaded files:', files && files.length > 0 ? files.map(f => f.originalname) : 'No files uploaded');
    
    return this.productService.createProduct(productData, userId , files);
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