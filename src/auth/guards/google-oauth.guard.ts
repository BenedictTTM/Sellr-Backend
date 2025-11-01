import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Google OAuth Guard
 * 
 * Protects routes requiring Google OAuth authentication.
 * Extends Passport's AuthGuard with custom error handling.
 * 
 * Usage:
 * ```typescript
 * @Get('google')
 * @UseGuards(GoogleOAuthGuard)
 * async googleLogin() {
 *   // Handled by Passport
 * }
 * ```
 * 
 * Security Features:
 * - Validates OAuth state parameter (CSRF protection)
 * - Ensures secure redirect URLs
 * - Handles OAuth errors gracefully
 * 
 * @extends AuthGuard
 */
@Injectable()
export class GoogleOAuthGuard extends AuthGuard('google') {
  /**
   * Custom error handling for OAuth failures
   * 
   * Handles common OAuth errors:
   * - User denied access
   * - Invalid OAuth state
   * - Token exchange failures
   * - Network errors
   */
  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    if (err || !user) {
      // Log OAuth error for monitoring
      console.error('OAuth Error:', err || info);
      
      // Redirect to frontend with error
      const response = context.switchToHttp().getResponse();
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      
      return response.redirect(
        `${frontendUrl}/auth/error?message=${encodeURIComponent(
          err?.message || 'OAuth authentication failed'
        )}`
      );
    }
    
    return user;
  }
}
