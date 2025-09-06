import { Injectable, ForbiddenException, Logger } from '@nestjs/common';
import { TokenService } from './token.service';
import { UserValidationService } from './user-validation.service';

@Injectable()
export class RefreshTokenService {
  private readonly logger = new Logger(RefreshTokenService.name);

  constructor(
    private readonly tokenService: TokenService,
    private readonly userValidationService: UserValidationService,
  ) {}

  async refreshTokens(refreshToken: string) {
    try {
      // 1. Verify refresh token JWT
      const payload = this.tokenService.verifyRefreshTokenJWT(refreshToken);
      const userId = payload.sub;

      // 2. Validate refresh token in database
      const isValidToken = await this.tokenService.verifyRefreshToken(userId, refreshToken);
      if (!isValidToken) {
        throw new ForbiddenException('Invalid refresh token');
      }

      // 3. Get user details
      const user = await this.userValidationService.getUserById(userId);
      if (!user || user.isDeleted) {
        throw new ForbiddenException('User no longer exists');
      }

      // 4. Generate new tokens
      const newTokens = await this.tokenService.generateTokens(user.id, user.email, user.role);

      // 5. Store new refresh token (token rotation)
      await this.tokenService.storeRefreshToken(user.id, newTokens.refresh_token);

      this.logger.log(`Tokens refreshed for user: ${userId}`);
      return newTokens;

    } catch (error) {
      this.logger.error(`Token refresh error: ${error.message}`);
      throw new ForbiddenException('Token refresh failed');
    }
  }
}