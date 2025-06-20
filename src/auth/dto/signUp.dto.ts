import { 
  IsEmail, 
  IsNotEmpty, 
  IsOptional, 
  IsString, 
  MinLength, 
  MaxLength, 
  Matches 
} from 'class-validator';

export class SignUpDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  @MaxLength(50, { message: 'Password must not exceed 50 characters' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
  })
  
  password: string;

  @IsOptional()
  @IsString({ message: 'First name must be a string' })
  @MaxLength(30, { message: 'First name must not exceed 30 characters' })
  firstName?: string;

  @IsOptional()
  @IsString({ message: 'Last name must be a string' })
  @MaxLength(30, { message: 'Last name must not exceed 30 characters' })
  lastName?: string;
}