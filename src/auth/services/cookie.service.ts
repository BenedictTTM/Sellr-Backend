import { Injectable, Logger } from '@nestjs/common';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';

export interface AuthResult {
  user: any;
  success: boolean;
  message: string;
  remainingSlots?: number;
}

@Injectable()
export class CookieService {
  private readonly logger = new Logger(CookieService.name);

  constructor(private readonly configService: ConfigService) {}

  setAuthCookies(res: Response, accessToken: string, refreshToken: string): void {
    const isProduction = this.configService.get('NODE_ENV') === 'production';
    const accessTokenMaxAge = parseInt(this.configService.get('JWT_EXPIRES_IN_MS', '1500000'));
    const refreshTokenMaxAge = parseInt(this.configService.get('JWT_REFRESH_EXPIRES_IN_MS', '604800000'));
    
    this.logger.debug('🍪 Setting authentication cookies', {
      isProduction,
      accessTokenMaxAge,
      refreshTokenMaxAge,
      accessTokenLength: accessToken.length,
      refreshTokenLength: refreshToken.length,
    });
    
    const cookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax' as const,
      path: '/',
    };
    
    this.logger.debug('🍪 Cookie options:', cookieOptions);
    
    res.cookie('access_token', accessToken, {
      ...cookieOptions,
      maxAge: accessTokenMaxAge,
    });
    
    res.cookie('refresh_token', refreshToken, {
      ...cookieOptions,
      maxAge: refreshTokenMaxAge,
    });

    this.logger.debug('✅ Authentication cookies set successfully');
  }

  clearAuthCookies(res: Response): void {
    this.logger.debug('🧹 Clearing authentication cookies');
    
    const isProduction = this.configService.get('NODE_ENV') === 'production';
    const cookieOptions = {
      httpOnly: true,
      path: '/',
      secure: isProduction,
      sameSite: 'lax' as const,
    };

    res.clearCookie('access_token', cookieOptions);
    res.clearCookie('refresh_token', cookieOptions);
    
    this.logger.debug('✅ Authentication cookies cleared');
  }

  // Helper method to handle auth response with cookies
  handleAuthResponse(res: Response, result: any): AuthResult {
    this.logger.debug('📝 Processing auth response...');
    
    if (result.access_token && result.refresh_token) {
      this.setAuthCookies(res, result.access_token, result.refresh_token);
      
      // Remove tokens from response
      const { access_token, refresh_token, ...cleanResult } = result;
      this.logger.debug('✅ Auth response processed - tokens moved to cookies');
      return cleanResult;
    }
    
    this.logger.warn('⚠️ No tokens found in auth response');
    return result;
  }

  // Helper method to handle logout with cookie cleanup
  handleLogoutResponse(res: Response, result: any): any {
    this.logger.debug('🚪 Processing logout response...');
    this.clearAuthCookies(res);
    this.logger.debug('✅ Logout response processed');
    return result;
  }
}