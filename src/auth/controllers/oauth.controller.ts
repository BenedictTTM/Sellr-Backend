import { Controller, Get, Req, Res, UseGuards, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { GoogleOAuthGuard } from '../guards/google-oauth.guard';
import { OAuthService } from '../services/oauth.service';
import { CookieService } from '../services/cookie.service';
import { ConfigService } from '@nestjs/config';

/**
 * OAuth Authentication Controller
 * 
 * Handles OAuth authentication flows for multiple providers.
 * Currently supports: Google OAuth 2.0
 * 
 * Endpoints:
 * - GET /auth/oauth/google - Initiates Google OAuth flow
 * - GET /auth/oauth/google/callback - Handles Google OAuth callback
 * 
 * Enterprise Features:
 * - Secure cookie-based authentication
 * - Automatic token refresh
 * - Frontend redirect with error handling
 * - Comprehensive logging and monitoring
 * - CORS-compliant authentication
 * 
 * Security:
 * - HTTP-only cookies for tokens
 * - SameSite=Strict for CSRF protection
 * - Secure flag in production
 * - State parameter validation
 * 
 * @class OAuthController
 */
@Controller('auth/oauth')
export class OAuthController {
  private readonly logger = new Logger(OAuthController.name);
  private readonly frontendUrl: string;

  constructor(
    private readonly oauthService: OAuthService,
    private readonly cookieService: CookieService,
    private readonly configService: ConfigService,
  ) {
    this.frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
  }

  /**
   * Initiate Google OAuth Flow
   * 
   * Redirects user to Google's OAuth consent screen.
   * Passport automatically handles:
   * - OAuth URL construction
   * - State parameter generation (CSRF protection)
   * - Scope parameter inclusion
   * - Redirect URI validation
   * 
   * @route GET /auth/oauth/google
   * @guard GoogleOAuthGuard
   * 
   * Flow:
   * 1. User clicks "Login with Google"
   * 2. Frontend redirects to this endpoint
   * 3. Backend redirects to Google OAuth
   * 4. User authorizes on Google
   * 5. Google redirects to callback URL
   * 
   * @example
   * // Frontend implementation:
   * <a href="http://api.example.com/auth/oauth/google">
   *   Login with Google
   * </a>
   */
  @Get('google')
  @UseGuards(GoogleOAuthGuard)
  async googleLogin() {
    // Passport handles the redirect to Google
    this.logger.log('🚀 Initiating Google OAuth flow');
  }

  /**
   * Google OAuth Callback Handler
   * 
   * Handles the OAuth callback from Google after user authorization.
   * Implements comprehensive error handling and user provisioning.
   * 
   * @route GET /auth/oauth/google/callback
   * @guard GoogleOAuthGuard
   * 
   * Flow:
   * 1. Google redirects with authorization code
   * 2. GoogleOAuthGuard validates and exchanges code for tokens
   * 3. Strategy validates and extracts user profile
   * 4. This handler receives authenticated user
   * 5. Create/update user in database
   * 6. Generate JWT tokens
   * 7. Set secure HTTP-only cookies
   * 8. Redirect to frontend success page
   * 
   * Error Handling:
   * - OAuth errors → Redirect to error page
   * - Database errors → Redirect with error message
   * - Network errors → Redirect with retry option
   * 
   * @param req - Express request with authenticated user
   * @param res - Express response for cookie setting
   * @returns Redirect to frontend with authentication state
   * 
   * @example
   * // Successful response sets cookies and redirects:
   * Set-Cookie: access_token=<JWT>; HttpOnly; Secure; SameSite=Strict
   * Set-Cookie: refresh_token=<JWT>; HttpOnly; Secure; SameSite=Strict
   * Location: http://localhost:3000/dashboard
   */
  @Get('google/callback')
  @UseGuards(GoogleOAuthGuard)
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    try {
      this.logger.log('✅ Google OAuth callback received');

      // Extract OAuth user from request (set by Passport strategy)
      const oauthUser = req.user as any;

      if (!oauthUser) {
        this.logger.warn('❌ No user data in OAuth callback');
        return res.redirect(`${this.frontendUrl}/auth/oauth-callback?message=Authentication failed`);
      }

      this.logger.debug(`🔍 Processing OAuth user: ${oauthUser.email}`);

      // Authenticate or create user
      const result = await this.oauthService.authenticateOAuthUser(oauthUser);

      // Set authentication cookies using CookieService
      this.cookieService.setAuthCookies(res, result.access_token, result.refresh_token);

      this.logger.log(`✅ OAuth authentication successful for: ${result.user.email}`);

      // Redirect to frontend OAuth callback page with success status
      return res.redirect(`${this.frontendUrl}/auth/oauth-callback?oauth=success`);
    } catch (error) {
      this.logger.error('❌ OAuth callback failed:', error);

      // Redirect to frontend OAuth callback with error
      const errorMessage = encodeURIComponent(
        error.message || 'Authentication failed'
      );
      return res.redirect(`${this.frontendUrl}/auth/oauth-callback?message=${errorMessage}`);
    }
  }

  /**
   * OAuth Success Endpoint
   * 
   * Alternative endpoint that returns JSON instead of redirect.
   * Useful for mobile apps or SPAs that prefer JSON responses.
   * 
   * @route GET /auth/oauth/success
   * @returns User data and tokens in JSON format
   * 
   * @example
   * // Response:
   * {
   *   "success": true,
   *   "user": { ... },
   *   "message": "OAuth authentication successful"
   * }
   */
  @Get('success')
  async oauthSuccess(@Req() req: Request) {
    const user = req.user;
    
    return {
      success: true,
      user,
      message: 'OAuth authentication successful',
    };
  }

  /**
   * OAuth Error Endpoint
   * 
   * Handles OAuth errors with detailed error information.
   * Provides user-friendly error messages and retry options.
   * 
   * @route GET /auth/oauth/error
   * @returns Error details in JSON format
   * 
   * @example
   * // Response:
   * {
   *   "success": false,
   *   "error": "OAuth authentication failed",
   *   "details": "User denied access"
   * }
   */
  @Get('error')
  async oauthError(@Req() req: Request) {
    const errorMessage = req.query.message || 'OAuth authentication failed';
    
    return {
      success: false,
      error: errorMessage,
      message: 'Please try again or use a different authentication method',
    };
  }
}
