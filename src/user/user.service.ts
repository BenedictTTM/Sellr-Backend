import { PrismaService } from "../prisma/prisma.service";
import { Prisma, Role } from '@prisma/client';
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { UserDto } from "../user/dto/user.dto";
import { UpdateProfileDto } from "../user/dto/update-profile.dto";

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
                storeName: true,
                profilePic: true,
                premiumTier: true,
                availableSlots: true,
                usedSlots: true,
                role: true,
                rating: true,
                totalRatings: true,
                products: {
                    select: {
                        id: true,
                        title: true,
                        discountedPrice: true,
                        createdAt: true,
                        category: true,
                        isActive: true,
                        description: true,
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
                storeName: true,
                profilePic: true,
                premiumTier: true,
                availableSlots: true,
                usedSlots: true,
                role: true,
                rating: true,
                totalRatings: true,
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
            storeName: true,
            profilePic: true,
            premiumTier: true,
            availableSlots: true,
            usedSlots: true,
            role: true,
            rating: true,
            totalRatings: true,
        }
    })
    return users;
  }

  /**
   * Update user profile (name, store name, profile picture)
   * Professional approach: Separate profile updates from sensitive data updates
   */
  async updateProfile(userId: number, updateProfileDto: UpdateProfileDto) {
    // Check if user exists
    const existingUser = await this.prismaService.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Update only profile-related fields
    const updatedUser = await this.prismaService.user.update({
      where: { id: userId },
      data: {
        ...(updateProfileDto.firstName && { firstName: updateProfileDto.firstName }),
        ...(updateProfileDto.lastName && { lastName: updateProfileDto.lastName }),
        ...(updateProfileDto.storeName && { storeName: updateProfileDto.storeName }),
        ...(updateProfileDto.profilePic && { profilePic: updateProfileDto.profilePic }),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        storeName: true,
        profilePic: true,
        role: true,
        premiumTier: true,
        rating: true,
        totalRatings: true,
        updatedAt: true,
      },
    });

    return updatedUser;
  }

  /**
   * Upload profile picture
   * This method should be used with Cloudinary integration
   */
  async updateProfilePicture(userId: number, imageUrl: string) {
    if (!imageUrl) {
      throw new BadRequestException('Image URL is required');
    }

    const updatedUser = await this.prismaService.user.update({
      where: { id: userId },
      data: { profilePic: imageUrl },
      select: {
        id: true,
        profilePic: true,
      },
    });

    return updatedUser;
  }
}