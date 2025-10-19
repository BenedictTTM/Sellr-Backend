import {IsEmail  , IsString , IsOptional , IsNumber} from "class-validator";

export class UserDto {
    @IsEmail({},{message: 'Please provide a valid email address'})
    @IsOptional()
    @IsString({message: 'Email must be a string'})
    email: string;

    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    firstName?: string;

    @IsOptional()
    @IsString()
    lastName?: string;

    @IsOptional()
    @IsString()
    storeName?: string;

    @IsOptional()
    @IsString()
    profilePic?: string;

    @IsOptional()
    @IsNumber()
    availableSlots?: number = 10; // Default slots available

    @IsOptional()
    @IsString()
    products?: string; // Optional product field

    @IsOptional()
    @IsString()
    role?: string;
}







