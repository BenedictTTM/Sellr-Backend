
import { Injectable } from '@nestjs/common';
import { CrudService } from "./Service/crud.products.service"; 
import { GetProductsService } from "./Service/getproducts.service";
import { ProductDto } from "./dto/product.dto"; // Adjust path as necessary

@Injectable()
export class ProductService {
  constructor(
    private readonly crudService: CrudService,
    private readonly getProductsService: GetProductsService
  ) {}

  async createProduct(productData: ProductDto , userId: number , files?: Express.Multer.File[]) {
    return this.crudService.createProduct(productData , userId , files);
  }

    async updateProduct(productId: number, productData: ProductDto , userId:number) {
        return this.crudService.updateProduct(productId, productData , userId);
    }

    async deleteProduct(productId: number , userId: number) {
        return this.crudService.deleteProduct(productId , userId);
    }

    async getAllProducts(page?: number, limit?: number) {
        return this.getProductsService.getAllProducts(page, limit);
    }

    async getProductById(productId : number ){
        return this.getProductsService.getProductById(productId);
    }

    async getProductsByUserId(userId: number, page?: number, limit?: number) {
        return this.getProductsService.getProductsByUserId(userId, page, limit);
    }
   
    async getProductsByCategory(category: string, page?: number, limit?: number) {
        return this.getProductsService.getProductsByCategory(category, page, limit);
    }

    async searchProducts(query: string) {
        return this.getProductsService.searchProducts(query);
    }

}