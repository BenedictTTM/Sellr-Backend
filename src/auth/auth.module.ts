import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LoginService } from './services/login.service';
import { SignupService } from './services/signup.service';
import { TokenService } from './services/token.service';
import { UserValidationService } from './services/user-validation.service';
import { RefreshTokenService } from './services/refresh-token.service';
import { LogoutService } from './services/logout.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    ConfigModule,
    JwtModule.register({
      global: true,
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    LoginService,
    SignupService,
    TokenService,
    UserValidationService,
    RefreshTokenService,
    LogoutService,
  ],
  exports: [
    AuthService,
    TokenService,
    UserValidationService,
  ],
})
export class AuthModule {}