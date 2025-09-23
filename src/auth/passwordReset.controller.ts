import { 
  Controller, 
  Post, 
  Body, 
  Get, 
  Query, 
  HttpStatus, 
  HttpCode,
  ValidationPipe
} from '@nestjs/common';
import { PasswordResetService } from './services/passwordReset.service';
import { RequestPasswordResetDto, ResetPasswordDto } from './dto/passwordReset.dto';

@Controller('auth/password-reset')
export class PasswordResetController {
  constructor(private readonly passwordResetService: PasswordResetService) {}

  @Post('request')
  @HttpCode(HttpStatus.OK)
  async requestPasswordReset(
    @Body(new ValidationPipe({ transform: true, whitelist: true })) 
    requestDto: RequestPasswordResetDto
  ) {
    return this.passwordResetService.requestPasswordReset(requestDto.email);
  }

  @Post('reset')
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Body(new ValidationPipe({ transform: true, whitelist: true })) 
    resetDto: ResetPasswordDto
  ) {
    return this.passwordResetService.resetPassword(
      resetDto.token, 
      resetDto.newPassword
    );
  }
}