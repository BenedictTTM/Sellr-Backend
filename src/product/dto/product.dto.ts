import { IsString , IsNotEmpty, IsOptional , IsNumber , IsArray } from "class-validator";
import { Transform } from 'class-transformer';

export class ProductDto {
    @IsString({ message: 'Title must be a string' })
    @IsNotEmpty({ message: 'Title is required' })
    title: string;
     
    @IsString({ message: 'Description must be a string' })
    @IsNotEmpty({ message: 'Description is required' })
    description: string;

    @IsString({ message: 'Image URL must be a string' })
    @IsOptional()
    imageUrl?: string;

     
    @Transform(({ value }) => parseFloat(value)) // Transform string to number
    @IsNotEmpty({ message: 'Price is required' })
    price: number;

    @Transform(({ value }) => parseFloat(value)) // Transform string to number
    @IsOptional()
    @IsNumber({}, { message: 'Rating must be a number' })
    rating?: number;

    @Transform(({ value }) => parseFloat(value)) // Transform string to number
    @IsOptional()
    @IsNumber({}, { message: 'Views must be a number' })
    views?: number;
     
    @Transform(({ value }) => parseFloat(value)) // Transform string to number
    @IsNotEmpty({ message: 'discount is required' })
    discount?: number;

    @IsString({ message: 'Category must be a string' })
    category: string;

    @IsNotEmpty({ message: 'User ID is required' })
    @IsOptional()
    userId?: number;

  @IsNumber()
  @IsOptional()
  locationLat?: number = 0.0; // Default value

  @IsNumber()
  @IsOptional()
  locationLng?: number = 0.0; // Default value

  @IsArray()
  @IsOptional()
  tags?: string[] = []; //w Default empty array
}