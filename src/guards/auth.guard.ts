import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);

  constructor(
    private jwtService: JwtService,
    private prismaService: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;
    const url = request.url;
    
    this.logger.debug(`🔐 AuthGuard triggered for: ${method} ${url}`);
    
    const token = this.extractTokenFromRequest(request);

    if (!token) {
      this.logger.warn(`❌ No token provided for: ${method} ${url}`);
      throw new UnauthorizedException('Access token is required');
    }

    try {
      // Verify JWT token
      this.logger.debug('🔍 Verifying JWT token...');
      const payload = this.jwtService.verify(token);
      
      this.logger.debug('✅ JWT verification successful');
      this.logger.debug('📋 JWT Payload structure:', {
        sub: payload.sub,
        id: payload.id,
        email: payload.email,
        iat: payload.iat,
        exp: payload.exp,
        hasExp: !!payload.exp,
        isExpired: payload.exp ? Date.now() >= payload.exp * 1000 : false,
      });
      
      // Use 'sub' (standard JWT claim) instead of 'id'
      const userId = payload.sub || payload.id;
      
      if (!userId) {
        this.logger.error('❌ No user ID found in token payload');
        throw new UnauthorizedException('Invalid token payload');
      }

      this.logger.debug(`👤 Fetching user details for ID: ${userId}`);

      // Fetch user details from database
      const user = await this.prismaService.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          role: true,
          isDeleted: true,
          firstName: true,
          lastName: true,
          premiumTier: true,
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

      this.logger.debug(`✅ User authenticated successfully: ${user.email} (ID: ${user.id})`);

      // Attach user to request object with full payload
      request.user = {
        ...payload,
        ...user,
      };
      
      return true;
    } catch (error) {
      this.logger.error(`🚨 Authentication failed for ${method} ${url}:`, {
        error: error.message,
        name: error.name,
        tokenPresent: !!token,
        tokenLength: token?.length,
      });
      
      if (error.name === 'TokenExpiredError') {
        this.logger.warn('⏰ Token has expired');
        throw new UnauthorizedException('Token has expired');
      }
      if (error.name === 'JsonWebTokenError') {
        this.logger.warn('🔧 Invalid token format');
        throw new UnauthorizedException('Invalid token format');
      }
      if (error.name === 'NotBeforeError') {
        this.logger.warn('⏰ Token not active yet');
        throw new UnauthorizedException('Token not active');
      }
      
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private extractTokenFromRequest(request: any): string | undefined {
    this.logger.debug('🔍 Extracting token from request...');
    
    // Debug request details
    this.logger.debug('📨 Request details:', {
      hasCookies: !!request.cookies,
      cookieCount: request.cookies ? Object.keys(request.cookies).length : 0,
      cookieNames: request.cookies ? Object.keys(request.cookies) : [],
      hasAuthHeader: !!request.headers.authorization,
      userAgent: request.headers['user-agent']?.substring(0, 50),
    });

    // Try to get token from cookies first (HTTP-only cookies)
    const cookieToken = request.cookies?.access_token;
    if (cookieToken) {
      this.logger.debug('🍪 Token found in cookies', {
        tokenLength: cookieToken.length,
        tokenPreview: cookieToken.substring(0, 20) + '...',
      });
      return cookieToken;
    } else {
      this.logger.debug('🍪 No access_token cookie found');
      if (request.cookies) {
        this.logger.debug('Available cookies:', Object.keys(request.cookies));
      }
    }

    // Fallback to Authorization header for backward compatibility
    const authHeader = request.headers.authorization;
    if (authHeader) {
      const [type, token] = authHeader.split(' ');
      if (type === 'Bearer' && token) {
        this.logger.debug('🔑 Token found in Authorization header', {
          tokenLength: token.length,
          tokenPreview: token.substring(0, 20) + '...',
        });
        return token;
      } else {
        this.logger.warn('⚠️ Invalid Authorization header format:', authHeader.substring(0, 50));
      }
    } else {
      this.logger.debug('🔑 No Authorization header found');
    }

    this.logger.warn('❌ No token found in cookies or Authorization header');
    return undefined;
  }
}