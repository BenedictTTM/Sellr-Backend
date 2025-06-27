
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

  async createProduct(productData: ProductDto , userId: number , file?: Express.Multer.File) {
    return this.crudService.createProduct(productData , userId , file);
  }

    async updateProduct(productId: number, productData: ProductDto , userId:number) {
        return this.crudService.updateProduct(productId, productData , userId);
    }

    async deleteProduct(productId: number , userId: number) {
        return this.crudService.deleteProduct(productId , userId);
    }

    async getAllProducts() {
        return this.getProductsService.getAllProducts();
    }

    async getProductById(productId : number ){
        return this.getProductsService.getProductById(productId);
    }

    async getProductsByUserId(userId: number) {
        return this.getProductsService.getProductsByUserId(userId);
    }
   
    async getProductsByCategory(category: string) {
        return this.getProductsService.getProductsByCategory(category);
    }

    async searchProducts(query: string) {
        return this.getProductsService.searchProducts(query);
    }

}