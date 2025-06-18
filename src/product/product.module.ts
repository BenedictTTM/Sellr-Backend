import { ProductService } from "./product.service";

export class ProductController {
    constructor(private readonly productService: ProductService) {}

    async getAllProducts() {
        return this.productService.getAllProducts();
    }

    async getProductById(productId: number) {
        return this.productService.getProductById(productId);
    }

    async createProduct(productData: any) {
        return this.productService.createProduct(productData);
    }

    async updateProduct(productId: number, productData: any) {
        return this.productService.updateProduct(productId, productData);
    }

    async deleteProduct(productId: number) {
        return this.productService.deleteProduct(productId);
    }

    async getProductsByUserId(userId: number) {
        return this.productService.getProductsByUserId(userId);
    }

    async getProductsByCategory(category: string) {
        return this.productService.getProductsByCategory(category);
    }

    
}


