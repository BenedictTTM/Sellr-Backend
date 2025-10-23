import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { PasswordResetController } from './passwordReset.controller';
import { AuthService } from './auth.service';
import { LoginService } from './services/login.service';
import { SignupService } from './services/signup.service';
import { TokenService } from './services/token.service';
import { UserValidationService } from './services/user-validation.service';
import { RefreshTokenService } from './services/refresh-token.service';
import { LogoutService } from './services/logout.service';
import { PrismaModule } from '../prisma/prisma.module';
import  {CookieService} from './services/cookie.service';
import { PasswordResetService } from './services/passwordReset.service';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    PrismaModule,
    ConfigModule,
    EmailModule,
    JwtModule.registerAsync({
      global: true,
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', '15m'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController, PasswordResetController],
  providers: [
    AuthService,
    LoginService,
    SignupService,
    TokenService,
    UserValidationService,
    RefreshTokenService,
    LogoutService,
    CookieService,
    PasswordResetService,
  ],
  exports: [
    AuthService,
    TokenService,
    UserValidationService,
    CookieService,
    PasswordResetService,
  ],
})
export class AuthModule {}