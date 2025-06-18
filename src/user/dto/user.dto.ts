import {IsEmail , IsNotEmpty , IsString , IsOptional , IsNumber} from "class-validator";

export class UserDto {
    @IsEmail({},{message: 'Please provide a valid email address'})
    @IsNotEmpty({message: 'Email is required'})
    @IsString({message: 'Email must be a string'})
    email: string;

     @IsNotEmpty()
    @IsString()
    name: string;


    @IsOptional()
    @IsNumber()
    availableSlots?: number = 10; // Default slots available

    @IsOptional()
    @IsString()
    products?: string; // Optional product field
    
   

}







