import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserService } from './user.service';
import { UserDto } from './dto/user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Controller('users')
export class UserController {
    constructor(
        private readonly userService: UserService,
        private readonly cloudinaryService: CloudinaryService
    ) {}

    @Get()
    getAllUsers() {
        return this.userService.getAllUsers();
    }

    @Get(':id')
    getUserById(@Param('id', ParseIntPipe) id: number) {
        return this.userService.getUserById(id);
    }

    @Get(':id/profile')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.userService.findOne(id);
    }

    @Patch(':id')
    updateUser(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateUserDto: UserDto
    ) {
        return this.userService.update(id, updateUserDto);
    }

    /**
     * Update user profile (firstName, lastName, storeName, profilePic)
     * Professional endpoint for profile management
     */
    @Patch(':id/profile')
    updateProfile(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateProfileDto: UpdateProfileDto
    ) {
        return this.userService.updateProfile(id, updateProfileDto);
    }

    /**
     * Upload profile picture
     * This endpoint should be integrated with Cloudinary
     */
    @Patch(':id/profile-picture')
    async updateProfilePicture(
        @Param('id', ParseIntPipe) id: number,
        @Body('imageUrl') imageUrl: string
    ) {
        if (!imageUrl) {
            throw new BadRequestException('Image URL is required');
        }
        return this.userService.updateProfilePicture(id, imageUrl);
    }

    /**
     * Upload profile picture via file upload (Multipart form-data)
     * Professional approach: Direct file upload with Cloudinary integration
     * 
     * Usage with Postman/Frontend:
     * - Method: POST
     * - Content-Type: multipart/form-data
     * - Body: file field with image file
     */
    @Post(':id/upload-profile-picture')
    @UseInterceptors(FileInterceptor('file'))
    async uploadProfilePicture(
        @Param('id', ParseIntPipe) id: number,
        @UploadedFile() file: Express.Multer.File
    ) {
        if (!file) {
            throw new BadRequestException('No file uploaded');
        }

        // Validate file type
        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
        if (!allowedMimeTypes.includes(file.mimetype)) {
            throw new BadRequestException('Only JPEG, PNG, and WebP images are allowed');
        }

        // Validate file size (5MB max)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            throw new BadRequestException('File size must be less than 5MB');
        }

        // Upload to Cloudinary
        const uploadResult = await this.cloudinaryService.uploadProfilePicture(file);
        
        // Update user profile with new image URL
        const updatedUser = await this.userService.updateProfilePicture(id, uploadResult.secure_url);
        
        return {
            message: 'Profile picture uploaded successfully',
            user: updatedUser,
            imageUrl: uploadResult.secure_url,
        };
    }
}