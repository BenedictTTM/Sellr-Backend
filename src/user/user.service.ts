import { PrismaService } from "../prisma/prisma.service";
import { Prisma, Role } from '@prisma/client';
import { Injectable, NotFoundException } from '@nestjs/common';
import { UserDto } from "../user/dto/user.dto"; // Ensure this path is correct

@Injectable()
export class UserService {
    constructor(private readonly prismaService: PrismaService) {}

    async getUserById(userId: number) {
        const user = await this.prismaService.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                createdAt: true,
                email: true,
                firstName: true,
                lastName: true,
                premiumTier: true,
                availableSlots: true,
                usedSlots: true,
                role: true,
                products: {
                    select: {
                        id: true,
                        title: true,  // Use 'title' not 'name'
                        discountedPrice: true,
                        createdAt: true,
                        category: true,
                        isActive: true,
                        description: true, // Include description if needed

                    }
                }
            }
        });
        
        return user;
    }


    async findOne(userId: number) {
        const user = await this.prismaService.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                createdAt: true,
                email: true,
                firstName: true,
                lastName: true,
                premiumTier: true,
                availableSlots: true,
                usedSlots: true,
                role: true,
            }
        });

        if (!user) {
            throw new NotFoundException(`User with ID ${userId} not found`);
        }

        return user;
    }

    // ...existing code...
    async update(userId: number, updateUserDto: UserDto) {
        
        const updatedUser = await this.prismaService.user.update({
            where: { id: userId },
            data: {
                email: updateUserDto.email,
                firstName: updateUserDto.name,
                availableSlots: updateUserDto.availableSlots,
                ...(updateUserDto.role && { role: { set: updateUserDto.role as Role } }),

            },
            select: {
                id: true,
                createdAt: true,
                email: true,
                firstName: true,
                lastName: true,
                premiumTier: true,
                availableSlots: true,
                usedSlots: true,
                role: true,
            }
        });

        return updatedUser;
    }

  async getAllUsers() {
    const users = await this.prismaService.user.findMany({
        select: {
            id: true,
            createdAt: true,
            email: true,
            firstName: true,
            lastName: true,
            premiumTier: true,
            availableSlots: true,
            usedSlots: true,
            role: true,
        }
    })
    return users;

  }
}