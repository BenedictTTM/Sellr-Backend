import { PrismaService } from "../../prisma/prisma.service";
import { Injectable, NotFoundException } from '@nestjs/common';
import { ProductDto } from "../dto/product.dto";

@Injectable()
export class CrudService {
    constructor(private prisma: PrismaService) {}

    async createProduct(productData: ProductDto) {
        try {
            const newProduct = await this.prisma.product.create({
                data: {
                    ...productData,
                    isActive: true, // Default to active
                },
            });
            return newProduct;
        } catch (error) {
            throw new Error(`Failed to create product: ${error.message}`);
        }
    }

    async updateProduct(productId: number, productData: ProductDto) {
        try {
            const existingProduct = await this.prisma.product.findUnique({
                where: { id: productId },
            });

            if (!existingProduct) {
                throw new NotFoundException(`Product with ID ${productId} not found`);
            }

            const updatedProduct = await this.prisma.product.update({
                where: { id: productId },
                data: {
                    ...productData,
                },
            });

            return updatedProduct;
        } catch (error) {
            throw new Error(`Failed to update product: ${error.message}`);
        }
    }

    async deleteProduct(productId: number) {
        try {
            const existingProduct = await this.prisma.product.findUnique({
                where: { id: productId },
            });

            if (!existingProduct) {
                throw new NotFoundException(`Product with ID ${productId} not found`);
            }

            const deletedProduct = await this.prisma.product.update({
                where: { id: productId },
                data: {
                    isActive: false, // Soft delete
                },
            });

            return deletedProduct;
        } catch (error) {
            throw new Error(`Failed to delete product: ${error.message}`);
        }
    }
}
