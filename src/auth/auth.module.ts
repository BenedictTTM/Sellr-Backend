import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SignupService } from './services/signup.service';  // Import SignupService
import { LoginService } from './services/login.service';    // Import LoginService
import { PrismaModule } from '../prisma/prisma.module';
import  {JwtModule} from '@nestjs/jwt'; // Import JwtModule if needed for JWT functionality
import { AuthGuard } from '../guards/auth.guard';
import { RolesGuard } from '../guards/roles.guard'; // Import RolesGuard if needed for role-based access control

@Module({
  imports: [PrismaModule ,  JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '7d' },
    }), ],

  controllers: [AuthController],

  providers: [
    AuthService, 
    SignupService,  // Add SignupService here
    LoginService    // Add LoginService here
    , AuthGuard,    // Add AuthGuard if needed for authentication
    RolesGuard,    // Add RolesGuard if needed for role-based access control
  ],
  exports: [AuthService , JwtModule , AuthGuard , RolesGuard] // Export AuthService and JwtModule if needed in other modules,
})
export class AuthModule {}