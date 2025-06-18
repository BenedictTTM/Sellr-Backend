import { PrismaService } from "../prisma/prisma.service";
import { Injectable, NotFoundException } from '@nestjs/common';
import { ProductDto } from "./dto/product.dto"; // Ensure this path is correct

@Injectable()
export class ProductService {
    constructor(private readonly prismaService: PrismaService) {}

    async getAllProducts() {
        try {
            const products = await this.prismaService.product.findMany({
                select: {
                    id: true,
                    title: true,
                    price: true,
                    createdAt: true,
                    category: true,
                    isActive: true,
                    description: true,
                    imageUrl: true,
                },
                where: {
                    isActive: true, // Only get active products
                }
            });
            return products;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(error.message);
            } else {
                throw new Error('An unknown error occurred');
            }
        }
    }
s

    async getProductById(productId: number) {
        try {
            const product = await this.prismaService.product.findUnique({
                where: { id: productId },
                select: {
                    id: true,
                    title: true,
                    price: true,
                    createdAt: true,
                    category: true,
                    isActive: true,
                    description: true,
                    imageUrl: true,
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                        }
                    }
                }
            });

            if (!product) {
                throw new NotFoundException(`Product with ID ${productId} not found`);
            }

            return product;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(error.message);
            } else {
                throw new Error('An unknown error occurred');
            }
        }
    }

   

    async searchProducts(searchTerm: string) {
        try {
            const products = await this.prismaService.product.findMany({
                where: {
                    AND: [
                        { isActive: true }, // Only active products
                        {
                            OR: [
                                {
                                    title: {
                                        contains: searchTerm,
                                        mode: 'insensitive', // Case-insensitive search
                                    }
                                },
                                {
                                    description: {
                                        contains: searchTerm,
                                        mode: 'insensitive',
                                    }
                                },
                                {
                                    category: {
                                        contains: searchTerm,
                                        mode: 'insensitive',
                                    }
                                }
                            ]
                        }
                    ]
                },
                select: {
                    id: true,
                    title: true,
                    price: true,
                    createdAt: true,
                    category: true,
                    isActive: true,
                    description: true,
                    imageUrl: true,
                },
                orderBy: {
                    createdAt: 'desc', // Most recent first
                }
            });

            return products;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(error.message);
            } else {
                throw new Error('An unknown error occurred');
            }
        }
    }

    async getProductsByCategory(category: string) {
        try {
            const products = await this.prismaService.product.findMany({
                where: {
                    category: {
                        equals: category,
                        mode: 'insensitive',
                    },
                    isActive: true,
                },
                select: {
                    id: true,
                    title: true,
                    price: true,
                    createdAt: true,
                    category: true,
                    isActive: true,
                    description: true,
                    imageUrl: true,
                },
                orderBy: {
                    createdAt: 'desc',
                }
            });

            return products;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(error.message);
            } else {
                throw new Error('An unknown error occurred');
            }
        }
    }

    async getProductsByUserId(userId: number) {
        try {
            const products = await this.prismaService.product.findMany({
                where: {
                    userId: userId,
                },
                select: {
                    id: true,
                    title: true,
                    price: true,
                    createdAt: true,
                    category: true,
                    isActive: true,
                    description: true,
                    imageUrl: true,
                },
                orderBy: {
                    createdAt: 'desc',
                }
            });

            return products;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(error.message);
            } else {
                throw new Error('An unknown error occurred');
            }
        }
    }
}