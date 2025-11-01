import { IsEmail, IsNotEmpty, IsOptional, IsString, IsBoolean } from 'class-validator';

/**
 * OAuth User Data Transfer Object
 * 
 * Normalized structure for OAuth provider responses.
 * Ensures type safety and validation for OAuth user data.
 * 
 * Design Principles:
 * - Provider-agnostic (works with Google, Facebook, GitHub, etc.)
 * - Immutable after validation
 * - Clear separation of required vs optional fields
 * 
 * @class OAuthUserDto
 */
export class OAuthUserDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsString()
  @IsOptional()
  profilePic?: string;

  @IsString()
  @IsNotEmpty()
  googleId: string;

  @IsString()
  @IsNotEmpty()
  provider: string;

  @IsString()
  @IsOptional()
  accessToken?: string;

  @IsString()
  @IsOptional()
  refreshToken?: string;

  @IsBoolean()
  @IsOptional()
  isVerified?: boolean;
}
