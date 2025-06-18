import { IsString , IsNotEmpty  } from "class-validator";

export class ProductDto {
    @IsString({ message: 'Title must be a string' })
    @IsNotEmpty({ message: 'Title is required' })
    title: string;

    @IsString({ message: 'Description must be a string' })
    @IsNotEmpty({ message: 'Description is required' })
    description: string;

    @IsString({ message: 'Image URL must be a string' })
    @IsNotEmpty({ message: 'Image URL is required' })
    imageUrl: string;

    @IsNotEmpty({ message: 'Price is required' })
    price: number;

    @IsString({ message: 'Category must be a string' })
    category: string;

    @IsNotEmpty({ message: 'User ID is required' })
    userId: number;
}