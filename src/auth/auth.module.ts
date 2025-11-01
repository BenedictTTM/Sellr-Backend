import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { PasswordResetController } from './passwordReset.controller';
import { OAuthController } from './controllers/oauth.controller';
import { AuthService } from './auth.service';
import { LoginService } from './services/login.service';
import { SignupService } from './services/signup.service';
import { TokenService } from './services/token.service';
import { UserValidationService } from './services/user-validation.service';
import { RefreshTokenService } from './services/refresh-token.service';
import { LogoutService } from './services/logout.service';
import { OAuthService } from './services/oauth.service';
import { PrismaModule } from '../prisma/prisma.module';
import  {CookieService} from './services/cookie.service';
import { PasswordResetService } from './services/passwordReset.service';
import { EmailModule } from '../email/email.module';
import { GoogleStrategy } from './strategies/google.strategy';

/**
 * Authentication Module
 * 
 * Enterprise-grade authentication module supporting:
 * - Traditional email/password authentication
 * - Google OAuth 2.0
 * - JWT token management with refresh tokens
 * - Password reset flows
 * - Session management
 * 
 * Architecture:
 * - Strategy Pattern: Multiple auth strategies (local, OAuth)
 * - Service Layer: Business logic separation
 * - Guard Pattern: Route protection
 * - DTO Validation: Input sanitization
 * 
 * Security Features:
 * - Argon2 password hashing
 * - HTTP-only cookies for tokens
 * - Token rotation on refresh
 * - CSRF protection via SameSite cookies
 * - Rate limiting ready
 * 
 * @module AuthModule
 */
@Module({
  imports: [
    PrismaModule,
    ConfigModule,
    EmailModule,
    PassportModule.register({ 
      defaultStrategy: 'jwt',
      session: false, // Stateless authentication
    }),
    JwtModule.registerAsync({
      global: true,
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', '45m'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [
    AuthController, 
    PasswordResetController,
    OAuthController,
  ],
  providers: [
    // Core Services
    AuthService,
    LoginService,
    SignupService,
    TokenService,
    UserValidationService,
    RefreshTokenService,
    LogoutService,
    CookieService,
    PasswordResetService,
    
    // OAuth Services
    OAuthService,
    
    // Passport Strategies
    GoogleStrategy,
  ],
  exports: [
    AuthService,
    TokenService,
    UserValidationService,
    CookieService,
    PasswordResetService,
    OAuthService,
  ],
})
export class AuthModule {}