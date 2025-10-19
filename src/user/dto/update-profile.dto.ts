import { IsString, IsOptional, MaxLength, MinLength } from 'class-validator';

/**
 * DTO for updating user profile information
 * Separates profile updates from general user updates for better security
 */
export class UpdateProfileDto {
    @IsOptional()
    @IsString()
    @MinLength(2, { message: 'First name must be at least 2 characters long' })
    @MaxLength(50, { message: 'First name must not exceed 50 characters' })
    firstName?: string;

    @IsOptional()
    @IsString()
    @MinLength(2, { message: 'Last name must be at least 2 characters long' })
    @MaxLength(50, { message: 'Last name must not exceed 50 characters' })
    lastName?: string;

    @IsOptional()
    @IsString()
    @MinLength(2, { message: 'Store name must be at least 2 characters long' })
    @MaxLength(100, { message: 'Store name must not exceed 100 characters' })
    storeName?: string;

    @IsOptional()
    @IsString()
    profilePic?: string;
}
