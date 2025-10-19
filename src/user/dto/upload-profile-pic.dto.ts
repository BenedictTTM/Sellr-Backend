import { IsString, IsNotEmpty } from 'class-validator';

/**
 * DTO for profile picture upload
 * Used when uploading images via Cloudinary
 */
export class UploadProfilePicDto {
    @IsString()
    @IsNotEmpty({ message: 'Image URL is required' })
    imageUrl: string;
}
