import { Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service'; // Ensure this path is correct

@Controller('auth') // Base route: /auth
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login') // Route: POST /auth/login
  login() {
    return this.authService.login();
  }

  @Post('signup') // Route: POST /auth/signup
  signup() {
    return this.authService.signup();
  }
}
