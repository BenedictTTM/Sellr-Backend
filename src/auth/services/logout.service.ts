import {Injectable , Logger } from '@nestjs/common';
import { TokenService } from './token.service';

export class LogoutService  {
 private readonly logger = new Logger(LogoutService.name);

 constructor(private readonly tokenService: TokenService){}

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
}