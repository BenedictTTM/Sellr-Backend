import { Injectable, ForbiddenException, Logger, UnauthorizedException } from "@nestjs/common";
import { LoginDto } from "../dto/login.dto";
import { TokenService } from './token.service';
import { UserValidationService } from './user-validation.service';

@Injectable()
export class LoginService {
  private readonly logger = new Logger(LoginService.name);

  constructor(
    private readonly tokenService: TokenService,
    private readonly userValidationService: UserValidationService,
  ) {}

  async login(dto: LoginDto) {
    try {
      // 1. Validate user credentials
      const user = await this.userValidationService.validateUserCredentials(dto.email, dto.password);

      // 2. Generate tokens
      const tokens = await this.tokenService.generateTokens(user.id, user.email, user.role);

      // 3. Store refresh token
      await this.tokenService.storeRefreshToken(user.id, tokens.refresh_token);

      // 4. Prepare safe user data
      const safeUser = this.userValidationService.sanitizeUser(user);

      this.logger.log(`User logged in successfully: ${user.id}`);

      return {
        success: true,
        message: 'Login successful',
        user: safeUser,
        ...tokens,
        remainingSlots: safeUser.availableSlots - safeUser.usedSlots
      };

    } catch (error) {
      this.logger.error(`Login error for ${dto.email}: ${error.message}`);
      
      if (error instanceof ForbiddenException || error instanceof UnauthorizedException) {
        throw error;
      }

      throw new ForbiddenException('Authentication failed');
    }
  }
}