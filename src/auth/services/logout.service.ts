import {Injectable , Logger } from '@nestjs/common';
import { Response } from 'express';
import { TokenService } from './token.service';
import { CookieService } from './cookie.service';

@Injectable()
export class LogoutService  {
 private readonly logger = new Logger(LogoutService.name);

 constructor(
   private readonly tokenService: TokenService,
   private readonly cookieService: CookieService
 ){}

 async logout(userId: number): Promise <string> {
    try{
        const users = await this.tokenService.revokeRefreshToken(userId);
        this.logger.log(`User logged out successfully: ${userId}`);
        return 'Logout successful';
    }
    catch (error) {
        this.logger.error(`Logout error for user ${userId}: ${error.message}`);
        throw error;
    }
}

 /**
  * Logout with HTTP-only cookie clearing
  */
 async logoutWithCookies(userId: number, res: Response): Promise<any> {
    const logoutResult = await this.logout(userId);
    return this.cookieService.handleLogoutResponse(res, { 
      success: true, 
      message: logoutResult 
    });
 }
}