import { Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service'; // Ensure this path is correct
import { Body } from '@nestjs/common';
import { AuthDto } from './dto/auth.dto'; // Ensure this path is correct
// Import necessary decorators and services from NestJS

@Controller('auth') // Base route: /auth
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login') // Route: POST /auth/login
  login() {
    return this.authService.login();
  }

  @Post('signup') // Route: POST /auth/signup
  signup(@Body() dto: AuthDto) {
    return this.authService.signup(dto);
  }
}
