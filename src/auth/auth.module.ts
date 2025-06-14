import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SignupService } from './services/signup.service';  // Import SignupService
import { LoginService } from './services/login.service';    // Import LoginService
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AuthController],
  providers: [
    AuthService, 
    SignupService,  // Add SignupService here
    LoginService    // Add LoginService here
  ],
  exports: [AuthService],
})
export class AuthModule {}