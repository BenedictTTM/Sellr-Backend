import { IsEmail, IsNotEmpty, IsOptional, IsString, IsBoolean , MaxLength, MinLength } from 'class-validator';

export class AuthDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6 , { message: 'Password must be at least 6 characters long' })
  @MaxLength(20, { message: 'Password must not exceed 20 characters' })
 password: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsBoolean()
  isPremium?: boolean;


}