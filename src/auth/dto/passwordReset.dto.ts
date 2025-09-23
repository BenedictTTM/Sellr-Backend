import { IsEmail, IsString, MinLength, IsNotEmpty, isString } from 'class-validator';

export class RequestPasswordResetDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;
}

export class ResetPasswordDto {
  @IsString({message: 'Token must be a string'})
  @IsNotEmpty({ message: 'Token is required' })
  token: string;

  @IsString({ message: 'Password must be a string' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  @IsNotEmpty({ message: 'New password is required' })
  newPassword: string;
}