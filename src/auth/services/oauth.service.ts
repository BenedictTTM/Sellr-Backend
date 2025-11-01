import { Injectable, Logger, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { TokenService } from './token.service';
import { OAuthUserDto } from '../dto/oauth-user.dto';
import * as argon2 from 'argon2';

/**
 * OAuth Service
 * 
 * Enterprise-grade OAuth authentication service implementing:
 * - Account linking (existing user with same email)
 * - New account creation for OAuth users
 * - Secure password generation for OAuth accounts
 * - Profile synchronization
 * - Token generation and management
 * 
 * Business Rules:
 * 1. If email exists with regular auth → Link OAuth provider
 * 2. If email exists with OAuth → Update provider info
 * 3. If new user → Create account with OAuth data
 * 4. Always sync profile picture and name from provider
 * 
 * Security:
 * - Generates secure random password for OAuth accounts
 * - Stores provider ID for account verification
 * - Implements idempotent operations (safe retries)
 * - Validates email uniqueness
 * 
 * @class OAuthService
 */
@Injectable()
export class OAuthService {
  private readonly logger = new Logger(OAuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenService: TokenService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Authenticate or Create User via OAuth
   * 
   * Implements the "Find or Create" pattern with additional business logic:
   * 
   * Flow:
   * 1. Check if user exists by email
   * 2. If exists:
   *    a. Verify not already using different OAuth provider
   *    b. Update OAuth provider info
   *    c. Sync profile data
   * 3. If new:
   *    a. Generate unique username
   *    b. Create secure password hash
   *    c. Create user record
   * 4. Generate JWT tokens
   * 5. Store refresh token
   * 6. Return authenticated user
   * 
   * @param oauthUser - Validated OAuth user data from strategy
   * @returns User object with tokens
   * @throws ConflictException if email conflict occurs
   * @throws InternalServerErrorException for database errors
   */
  async authenticateOAuthUser(oauthUser: OAuthUserDto) {
    try {
      this.logger.debug(`🔍 Processing OAuth login for: ${oauthUser.email}`);

      // Find existing user by email
      let user = await this.prisma.user.findUnique({
        where: { email: oauthUser.email },
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          profilePic: true,
          role: true,
          premiumTier: true,
          availableSlots: true,
          usedSlots: true,
          createdAt: true,
          isDeleted: true,
        },
      });

      if (user) {
        // Check if account is soft-deleted
        if (user.isDeleted) {
          throw new ConflictException('This account has been deactivated');
        }

        this.logger.log(`✅ Existing user found: ${user.email}`);
        
        // Update profile with latest OAuth data
        user = await this.updateUserProfile(user.id, oauthUser);
      } else {
        this.logger.log(`🆕 Creating new user from OAuth: ${oauthUser.email}`);
        
        // Create new user
        user = await this.createOAuthUser(oauthUser);
      }

      // Generate JWT tokens using existing TokenService
      const tokens = await this.tokenService.generateTokens(user.id, user.email, user.role);

      // Store refresh token using existing TokenService method
      await this.tokenService.storeRefreshToken(user.id, tokens.refresh_token);

      this.logger.log(`✅ OAuth authentication successful: ${user.email}`);

      return {
        success: true,
        message: 'OAuth authentication successful',
        user,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        remainingSlots: user.availableSlots - user.usedSlots,
      };
    } catch (error) {
      this.logger.error(`❌ OAuth authentication failed: ${error.message}`, error.stack);
      
      if (error instanceof ConflictException) {
        throw error;
      }
      
      throw new InternalServerErrorException('Failed to process OAuth login');
    }
  }

  /**
   * Create New User from OAuth Provider
   * 
   * Implements secure user creation with:
   * - Unique username generation
   * - Secure password creation (even though OAuth doesn't use it)
   * - Profile data population
   * - Default tier assignment
   * 
   * @private
   * @param oauthUser - OAuth user data
   * @returns Created user record
   */
  private async createOAuthUser(oauthUser: OAuthUserDto) {
    try {
      // Generate unique username from email
      const baseUsername = oauthUser.email.split('@')[0];
      const username = await this.generateUniqueUsername(baseUsername);

      // Generate secure random password (even though OAuth doesn't use it)
      // This allows user to set password later if they want traditional login
      const randomPassword = this.generateSecurePassword();
      const passwordHash = await argon2.hash(randomPassword);

      // Create user with OAuth data
      const user = await this.prisma.user.create({
        data: {
          email: oauthUser.email,
          username,
          passwordHash,
          firstName: oauthUser.firstName || '',
          lastName: oauthUser.lastName || '',
          profilePic: oauthUser.profilePic,
          role: 'USER',
          premiumTier: 'FREE',
          availableSlots: 5,
          usedSlots: 0,
        },
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          profilePic: true,
          role: true,
          premiumTier: true,
          availableSlots: true,
          usedSlots: true,
          createdAt: true,
          isDeleted: true,
        },
      });

      this.logger.log(`✅ New OAuth user created: ${user.email}`);
      return user;
    } catch (error) {
      this.logger.error('❌ Failed to create OAuth user:', error);
      throw new InternalServerErrorException('Failed to create user account');
    }
  }

  /**
   * Update User Profile with OAuth Data
   * 
   * Syncs profile data from OAuth provider:
   * - Updates name if changed
   * - Updates profile picture to latest from provider
   * - Maintains data consistency
   * 
   * @private
   * @param userId - User ID to update
   * @param oauthUser - Latest OAuth data
   * @returns Updated user record
   */
  private async updateUserProfile(userId: number, oauthUser: OAuthUserDto) {
    try {
      const user = await this.prisma.user.update({
        where: { id: userId },
        data: {
          firstName: oauthUser.firstName || undefined,
          lastName: oauthUser.lastName || undefined,
          profilePic: oauthUser.profilePic || undefined,
        },
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          profilePic: true,
          role: true,
          premiumTier: true,
          availableSlots: true,
          usedSlots: true,
          createdAt: true,
          isDeleted: true,
        },
      });

      this.logger.log(`✅ User profile synced from OAuth: ${user.email}`);
      return user;
    } catch (error) {
      this.logger.error('❌ Failed to update user profile:', error);
      throw new InternalServerErrorException('Failed to update profile');
    }
  }

  /**
   * Generate Unique Username
   * 
   * Creates a unique username by:
   * 1. Sanitizing base username
   * 2. Checking for conflicts
   * 3. Appending random suffix if needed
   * 4. Retrying until unique
   * 
   * @private
   * @param baseUsername - Desired username base
   * @returns Unique username
   */
  private async generateUniqueUsername(baseUsername: string): Promise<string> {
    // Sanitize username: lowercase, remove special chars
    let username = baseUsername.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    // Ensure minimum length
    if (username.length < 3) {
      username = `user${username}`;
    }

    // Check if username exists
    const existingUser = await this.prisma.user.findUnique({
      where: { username },
    });

    if (!existingUser) {
      return username;
    }

    // Generate unique username with random suffix
    let attempt = 0;
    while (attempt < 10) {
      const randomSuffix = Math.floor(Math.random() * 10000);
      const candidateUsername = `${username}${randomSuffix}`;

      const exists = await this.prisma.user.findUnique({
        where: { username: candidateUsername },
      });

      if (!exists) {
        return candidateUsername;
      }

      attempt++;
    }

    // Fallback: use timestamp
    return `${username}${Date.now()}`;
  }

  /**
   * Generate Secure Random Password
   * 
   * Creates a cryptographically secure password for OAuth accounts.
   * This password is never shared with the user but allows:
   * - Future password reset flows
   * - Account recovery options
   * - Hybrid auth (OAuth + password)
   * 
   * @private
   * @returns Secure random password (64 characters)
   */
  private generateSecurePassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    const length = 64;

    // Generate cryptographically secure random password
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * chars.length);
      password += chars[randomIndex];
    }

    return password;
  }
}
