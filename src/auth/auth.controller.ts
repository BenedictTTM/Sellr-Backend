import { Controller, Get, Post, Body, Res, Req, UseGuards, UnauthorizedException, Logger } from '@nestjs/common';
import { Response, Request } from 'express';
import { LoginService } from './services/login.service';
import { SignupService } from './services/signup.service';
import { RefreshTokenService } from './services/refresh-token.service';
import { LogoutService } from './services/logout.service';
import { AuthGuard } from '../guards/auth.guard';
import { RefreshTokenGuard } from '../guards/refresh-token.guard';
import { GetUser } from '../decorators/user.decorators';
import { SignUpDto } from './dto/signUp.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly loginService: LoginService,
    private readonly signupService: SignupService,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly logoutService: LogoutService,
  ) {}

  @Post('login')
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    return this.loginService.loginWithCookies(dto, res);
  }

  @Post('signup')
  async signup(@Body() dto: SignUpDto, @Res({ passthrough: true }) res: Response) {
    return this.signupService.signupWithCookies(dto, res);
  }

  /**
   * Refresh Access Token Endpoint
   * 
   * Generates new access and refresh tokens using the refresh token from cookies.
   * Implements token rotation for enhanced security - old refresh token is invalidated.
   * 
   * Security Features:
   * - Uses RefreshTokenGuard for specialized validation
   * - Validates refresh token signature and expiration
   * - Checks token against database (prevents reuse)
   * - Implements token rotation (new refresh token issued)
   * - Returns new tokens via HTTP-only cookies
   * 
   * Flow:
   * 1. RefreshTokenGuard validates refresh token from cookie
   * 2. Service verifies token against database hash
   * 3. New access + refresh tokens generated
   * 4. Old refresh token invalidated
   * 5. New tokens stored in HTTP-only cookies
   * 
   * @route POST /auth/refresh
   * @guard RefreshTokenGuard - Validates refresh token
   * @cookie refresh_token - Required HTTP-only cookie
   * @returns Success message with new tokens in cookies
   * @throws UnauthorizedException if refresh token is invalid/expired
   * 
   * @example
   * // Frontend usage (automatic via cookies):
   * fetch('/api/auth/refresh', { 
   *   method: 'POST',
   *   credentials: 'include'
   * })
   */
  @Post('refresh')
  @UseGuards(RefreshTokenGuard)
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    this.logger.debug('🔄 Token refresh request received');
    
    const refreshToken = req.cookies?.refresh_token;
    if (!refreshToken) {
      this.logger.warn('❌ Refresh token not found in cookies');
      throw new UnauthorizedException('Refresh token not found');
    }
    
    this.logger.debug('✅ Refresh token found, processing...');
    const result = await this.refreshTokenService.refreshTokensWithCookies(refreshToken, res);
    
    this.logger.log('✅ Tokens refreshed successfully');
    return result;
  }

  @Post('logout')
  @UseGuards(AuthGuard)
  async logout(@GetUser() user: any, @Res({ passthrough: true }) res: Response) {
    return this.logoutService.logoutWithCookies(user.id, res);
  }

  /**
   * Lightweight session probe
   *
   * Provides a quick way for the frontend to validate whether the
   * authenticated session is still active. The AuthGuard will reject
   * unauthenticated requests with a 401, so a simple 200 response here
   * confirms the user is still logged in.
   */
  @Get('session')
  @UseGuards(AuthGuard)
  async session(@GetUser() user: any) {
    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      message: 'Session is active',
    };
  }

  /**
   * Verify Token Endpoint
   * 
   * Validates the access token and returns user information if valid.
   * Used by frontend to verify authentication status.
   * 
   * @route GET /auth/verify
   * @returns User information if token is valid
   * @throws UnauthorizedException if token is invalid or expired
   */
  @Get('verify')
  @UseGuards(AuthGuard)
  async verify(@GetUser() user: any) {
    // AuthGuard already validated the token and attached user to request
    return {
      success: true,
      message: 'Token is valid',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        premiumTier: user.premiumTier,
        availableSlots: user.availableSlots,
        usedSlots: user.usedSlots,
      },
    };
  }

  /**
   * Get Current User Endpoint
   * 
   * Returns the authenticated user's profile information.
   * Used by frontend to retrieve user details from token.
   * 
   * @route GET /auth/me
   * @returns Current user's profile data
   * @throws UnauthorizedException if not authenticated
   */
  @Get('me')
  @UseGuards(AuthGuard)
  async getCurrentUser(@GetUser() user: any) {
    // Return sanitized user object (no sensitive data)
    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        premiumTier: user.premiumTier,
        availableSlots: user.availableSlots,
        usedSlots: user.usedSlots,
        createdAt: user.createdAt,
      },
    };
  }
}
