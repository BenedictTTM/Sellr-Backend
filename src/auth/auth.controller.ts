import { Controller, Post, Body, Res, Req, UseGuards, UnauthorizedException } from '@nestjs/common';
import { Response, Request } from 'express';
import { LoginService } from './services/login.service';
import { SignupService } from './services/signup.service';
import { RefreshTokenService } from './services/refresh-token.service';
import { LogoutService } from './services/logout.service';
import { AuthGuard } from '../guards/auth.guard';
import { GetUser } from '../decorators/user.decorators';
import { SignUpDto } from './dto/signUp.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly loginService: LoginService,
    private readonly signupService: SignupService,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly logoutService: LogoutService,
  ) {}

  @Post('login')
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    return this.loginService.loginWithCookies(dto, res);
  }

  @Post('signup')
  async signup(@Body() dto: SignUpDto, @Res({ passthrough: true }) res: Response) {
    return this.signupService.signupWithCookies(dto, res);
  }

  @Post('refresh')
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.refresh_token;
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not found');
    }
    return this.refreshTokenService.refreshTokensWithCookies(refreshToken, res);
  }

  @Post('logout')
  @UseGuards(AuthGuard)
  async logout(@GetUser() user: any, @Res({ passthrough: true }) res: Response) {
    return this.logoutService.logoutWithCookies(user.id, res);
  }
}
