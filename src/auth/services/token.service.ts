import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';
import * as argon from 'argon2';

interface TokenPayload {
  sub: number; // Changed to number
  email: string;
  role: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
}

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prismaService: PrismaService,
  ) {}

  async generateTokens(userId: number, email: string, role: string): Promise<AuthTokens> {
    const payload: TokenPayload = {
      sub: userId, // Now a number
      email,
      role,
    };

    const [access_token, refresh_token] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: this.configService.get<string>('JWT_EXPIRES_IN'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN'),
      }),
    ]);

    return { access_token, refresh_token };
  }

  async storeRefreshToken(userId: number, refreshToken: string): Promise<void> {
    const hashedToken = await argon.hash(refreshToken);
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + 7);

    await this.prismaService.user.update({
      where: { id: userId }, // Now expects number
      data: { refreshToken: hashedToken, refreshTokenExp: expirationDate },
    });
  }

  async verifyRefreshToken(userId: number, refreshtoken: string): Promise<boolean> {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId }, // Now expects number
      select: { refreshToken: true, refreshTokenExp: true },
    });

    if (!user || !user.refreshToken || !user.refreshTokenExp) {
      return false;
    }

    const isValid = await argon.verify(user.refreshToken, refreshtoken);
    const isNotExpired = new Date() < user.refreshTokenExp;
    return isValid && isNotExpired;
  }

  async revokeRefreshToken(userId: number): Promise<void> {
    await this.prismaService.user.update({
      where: { id: userId }, // Now expects number
      data: { refreshToken: null, refreshTokenExp: null },
    });
  }

  verifyAccessToken(token: string): any {
    return this.jwtService.verify(token, {
      secret: this.configService.get<string>('JWT_SECRET'),
    });
  }

  verifyRefreshTokenJWT(token: string): any {
    return this.jwtService.verify(token, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
    });
  }
}