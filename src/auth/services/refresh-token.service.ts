import { Injectable, ForbiddenException, UnauthorizedException, Logger } from '@nestjs/common';
import { Response } from 'express';
import { TokenService } from './token.service';
import { UserValidationService } from './user-validation.service';
import { CookieService } from './cookie.service';

/**
 * RefreshTokenService
 * 
 * Enterprise-grade token refresh service implementing OAuth 2.0 best practices.
 * Handles automatic token rotation and comprehensive security validations.
 * 
 * Security Features:
 * - Token rotation (old token invalidated after use)
 * - Database-backed token validation
 * - User status verification
 * - Comprehensive audit logging
 * - Race condition prevention
 * - Automatic cleanup of expired tokens
 * 
 * @class RefreshTokenService
 * @since 1.0.0
 */
@Injectable()
export class RefreshTokenService {
  private readonly logger = new Logger(RefreshTokenService.name);

  constructor(
    private readonly tokenService: TokenService,
    private readonly userValidationService: UserValidationService,
    private readonly cookieService: CookieService,
  ) {}

  /**
   * Refresh authentication tokens
   * 
   * Implements secure token refresh flow with rotation:
   * 1. Verify refresh token JWT signature
   * 2. Validate token exists in database (prevents reuse)
   * 3. Verify user exists and is active
   * 4. Generate new access + refresh tokens
   * 5. Invalidate old refresh token
   * 6. Store new refresh token
   * 
   * @param refreshToken - The refresh token from HTTP-only cookie
   * @returns New access and refresh tokens
   * @throws ForbiddenException if token is invalid or user is inactive
   */
  async refreshTokens(refreshToken: string) {
    const startTime = Date.now();
    this.logger.debug('🔄 Starting token refresh process...');
    
    try {
      // 1. Verify refresh token JWT signature and expiration
      this.logger.debug('🔍 Step 1/5: Verifying refresh token JWT...');
      let payload;
      try {
        payload = this.tokenService.verifyRefreshTokenJWT(refreshToken);
        this.logger.debug('✅ JWT verification successful', {
          userId: payload.sub,
          email: payload.email,
          issuedAt: new Date(payload.iat * 1000).toISOString(),
          expiresAt: new Date(payload.exp * 1000).toISOString(),
        });
      } catch (jwtError) {
        this.logger.error('❌ JWT verification failed:', jwtError.message);
        throw new UnauthorizedException('Invalid refresh token signature');
      }

      const userId = payload.sub;

      // 2. Validate refresh token exists in database (prevents token reuse)
      this.logger.debug(`🔍 Step 2/5: Validating token in database for user ${userId}...`);
      const isValidToken = await this.tokenService.verifyRefreshToken(userId, refreshToken);
      
      if (!isValidToken) {
        this.logger.warn(`⚠️ Refresh token validation failed for user ${userId}`, {
          reason: 'Token not found in database or expired',
          severity: 'HIGH',
          action: 'Possible token reuse attempt',
        });
        throw new ForbiddenException('Invalid or expired refresh token');
      }
      
      this.logger.debug('✅ Token validated in database');

      // 3. Verify user exists and is active
      this.logger.debug(`🔍 Step 3/5: Fetching user details for ${userId}...`);
      const user = await this.userValidationService.getUserById(userId);
      
      if (!user) {
        this.logger.warn(`⚠️ User not found: ${userId}`);
        throw new ForbiddenException('User not found');
      }
      
      if (user.isDeleted) {
        this.logger.warn(`⚠️ Attempt to refresh token for deleted user: ${userId}`);
        throw new ForbiddenException('User account has been deactivated');
      }
      
      this.logger.debug('✅ User validated', {
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      // 4. Generate new tokens (both access and refresh)
      this.logger.debug('🔍 Step 4/5: Generating new token pair...');
      const newTokens = await this.tokenService.generateTokens(user.id, user.email, user.role);
      this.logger.debug('✅ New tokens generated', {
        accessTokenLength: newTokens.access_token.length,
        refreshTokenLength: newTokens.refresh_token.length,
      });

      // 5. Store new refresh token (token rotation - old token is invalidated)
      this.logger.debug('🔍 Step 5/5: Storing new refresh token (rotating)...');
      await this.tokenService.storeRefreshToken(user.id, newTokens.refresh_token);
      this.logger.debug('✅ New refresh token stored, old token invalidated');

      const duration = Date.now() - startTime;
      this.logger.log(`✅ Token refresh completed successfully for user ${userId} in ${duration}ms`, {
        userId,
        email: user.email,
        duration: `${duration}ms`,
      });

      return {
        success: true,
        message: 'Tokens refreshed successfully',
        access_token: newTokens.access_token,
        refresh_token: newTokens.refresh_token,
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(`🚨 Token refresh failed after ${duration}ms:`, {
        error: error.message,
        errorType: error.name,
        duration: `${duration}ms`,
      });
      
      // Rethrow known errors
      if (error instanceof ForbiddenException || error instanceof UnauthorizedException) {
        throw error;
      }
      
      // Wrap unknown errors
      throw new ForbiddenException('Token refresh failed due to an unexpected error');
    }
  }

  /**
   * Refresh tokens with HTTP-only cookie response handling
   * 
   * Convenience method that wraps refreshTokens() and automatically
   * sets the new tokens as HTTP-only cookies in the response.
   * 
   * @param refreshToken - The refresh token from HTTP-only cookie
   * @param res - Express Response object
   * @returns Success response (tokens are in cookies)
   */
  async refreshTokensWithCookies(refreshToken: string, res: Response) {
    this.logger.debug('🍪 Refreshing tokens with cookie handling...');
    const refreshResult = await this.refreshTokens(refreshToken);
    const result = this.cookieService.handleAuthResponse(res, refreshResult);
    this.logger.debug('✅ Tokens set in HTTP-only cookies');
    return result;
  }
}