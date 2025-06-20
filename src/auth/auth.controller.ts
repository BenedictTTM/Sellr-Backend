import { Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service'; // Ensure this path is correct
import { Body } from '@nestjs/common';
import { SignUpDto } from './dto/signUp.dto'; // Ensure this path is correct
import { LoginDto } from './dto/login.dto';

// Import necessary decorators and services from NestJS

@Controller('auth') // Base route: /auth
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login') // Route: POST /auth/login
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('signup') // Route: POST /auth/signup
  signup(@Body() dto: SignUpDto) {
    return this.authService.signup(dto);
  }
}
