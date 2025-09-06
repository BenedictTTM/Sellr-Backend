import { Injectable, UnauthorizedException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as argon from 'argon2';

@Injectable()
export class UserValidationService {
  private readonly logger = new Logger(UserValidationService.name);

  constructor(private readonly prismaService: PrismaService) {}

  async validateUserCredentials(email: string, password: string) {
    const user = await this.prismaService.user.findUnique({
      where: { email },
    });

    if (!user) {
      this.logger.warn(`Login failed: User not found for email ${email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.isDeleted) {
      this.logger.warn(`Login attempt on deleted account: ${email}`);
      throw new ForbiddenException('Account has been deactivated');
    }

    const isPasswordValid = await argon.verify(user.passwordHash, password);
    if (!isPasswordValid) {
      this.logger.warn(`Invalid password for email ${email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  sanitizeUser(user: any) {
    const { passwordHash, refreshToken, refreshTokenExp, isDeleted, ...safeUser } = user;
    return safeUser;
  }

  async getUserById(userId: number) {
    return this.prismaService.user.findUnique({
      where: { id: userId },
    });
  }
}