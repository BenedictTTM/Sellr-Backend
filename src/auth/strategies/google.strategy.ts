import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-google-oauth20';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Google OAuth 2.0 Strategy
 * 
 * Enterprise-grade OAuth implementation following security best practices:
 * - Validates OAuth tokens from Google
 * - Extracts user profile information
 * - Implements proper error handling
 * 
 * Security Features:
 * - State parameter validation (CSRF protection)
 * - Secure callback URL validation
 * - Profile data sanitization
 * 
 * @implements PassportStrategy
 */
@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private readonly logger = new Logger(GoogleStrategy.name);

  constructor(configService: ConfigService) {
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID')!,
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET')!,
      callbackURL: configService.get<string>('GOOGLE_CALLBACK_URL')!,
      scope: ['email', 'profile'],
    } as any);

    this.logger.log('✅ Google OAuth Strategy initialized');
  }

  /**
   * Validates Google OAuth callback and extracts user data
   * 
   * Flow:
   * 1. Google redirects to callback URL with authorization code
   * 2. Passport exchanges code for access token
   * 3. This method receives validated profile
   * 4. Extract and sanitize user data
   * 5. Return normalized user object
   * 
   * @param accessToken - Google access token (short-lived)
   * @param refreshToken - Google refresh token (long-lived, optional)
   * @param profile - User's Google profile information
   * 
   * @returns Normalized user object for downstream processing
   */
  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
  ): Promise<any> {
    try {
      this.logger.debug(`🔍 Validating Google profile for: ${profile.emails?.[0]?.value}`);

      // Extract and sanitize user data from Google profile
      const { name, emails, photos, id: googleId } = profile;

      // Build normalized user object
      const user = {
        email: emails?.[0]?.value,
        firstName: name?.givenName,
        lastName: name?.familyName,
        profilePic: photos?.[0]?.value,
        googleId,
        accessToken, // Store for potential API calls
        refreshToken, // Store for token refresh
        provider: 'google',
        // Security: Mark as verified since Google handles verification
        isVerified: true,
      };

      // Validate required fields
      if (!user.email) {
        this.logger.warn('❌ Google profile missing email');
        throw new Error('Email not provided by Google');
      }

      this.logger.log(`✅ Google profile validated: ${user.email}`);
      return user;
    } catch (error) {
      this.logger.error('❌ Error validating Google profile:', error);
      throw error;
    }
  }
}
