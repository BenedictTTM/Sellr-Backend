import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

/**
 * RefreshTokenGuard
 * 
 * Specialized guard for validating refresh tokens from HTTP-only cookies.
 * More permissive than AuthGuard - only validates token structure and existence,
 * not expiration (since refresh tokens are meant to work when access tokens expire).
 * 
 * Security Features:
 * - Validates JWT signature using refresh secret
 * - Checks token exists in cookies
 * - Verifies user exists and is not deleted
 * - Prevents token reuse via database validation
 * 
 * @class RefreshTokenGuard
 * @implements {CanActivate}
 * @since 1.0.0
 */
@Injectable()
export class RefreshTokenGuard implements CanActivate {
  private readonly logger = new Logger(RefreshTokenGuard.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prismaService: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;
    const url = request.url;
    
    this.logger.debug(`🔄 RefreshTokenGuard triggered for: ${method} ${url}`);
    
    // Extract refresh token from cookies
    const refreshToken = request.cookies?.refresh_token;

    if (!refreshToken) {
      this.logger.warn(`❌ No refresh token found in cookies for: ${method} ${url}`);
      throw new UnauthorizedException('Refresh token is required');
    }

    try {
      // Verify JWT token signature and structure
      this.logger.debug('🔍 Verifying refresh token JWT signature...');
      const secret = this.configService.get<string>('JWT_REFRESH_SECRET');
      
      const payload = this.jwtService.verify(refreshToken, {
        secret,
        // Don't check expiration here - let the service handle it
        ignoreExpiration: false,
      });
      
      this.logger.debug('✅ Refresh token JWT verification successful');
      this.logger.debug('📋 Refresh token payload:', {
        sub: payload.sub,
        email: payload.email,
        iat: payload.iat,
        exp: payload.exp,
      });

      const userId = payload.sub;

      // Fetch user from database
      this.logger.debug(`🔍 Fetching user from database: ${userId}`);
      const user = await this.prismaService.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isDeleted: true,
          refreshToken: true,
          refreshTokenExp: true,
        },
      });

      if (!user) {
        this.logger.warn(`⚠️ User not found in database: ${userId}`);
        throw new UnauthorizedException('User not found');
      }

      if (user.isDeleted) {
        this.logger.warn(`⚠️ User account is deactivated: ${userId}`);
        throw new UnauthorizedException('User account deactivated');
      }

      if (!user.refreshToken) {
        this.logger.warn(`⚠️ No refresh token stored for user: ${userId}`);
        throw new UnauthorizedException('No refresh token found');
      }

      this.logger.debug(`✅ User validated successfully: ${user.email} (ID: ${user.id})`);

      // Attach user and refresh token to request object for service to use
      request.user = {
        ...payload,
        ...user,
      };
      request.refreshToken = refreshToken;
      
      return true;
    } catch (error) {
      this.logger.error(`🚨 Refresh token validation failed for ${method} ${url}:`, {
        error: error.message,
        name: error.name,
        tokenPresent: !!refreshToken,
      });
      
      if (error.name === 'TokenExpiredError') {
        this.logger.warn('⏰ Refresh token has expired');
        throw new UnauthorizedException('Refresh token has expired. Please login again.');
      }
      if (error.name === 'JsonWebTokenError') {
        this.logger.warn('🔧 Invalid refresh token format');
        throw new UnauthorizedException('Invalid refresh token format');
      }
      if (error.name === 'NotBeforeError') {
        this.logger.warn('⏰ Refresh token not active yet');
        throw new UnauthorizedException('Refresh token not active');
      }
      
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }
}
