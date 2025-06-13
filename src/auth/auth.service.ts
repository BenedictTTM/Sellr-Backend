import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AuthDto } from "./dto/auth.dto";

export interface User {
  id: number;
  createdAt: Date;
  email: string;
  firstName: string;
  lastName: string;
  isPremium: boolean;
}

@Injectable()
export class AuthService {
  constructor(private prismaService: PrismaService) {}

  async signup(dto: AuthDto) {
    try {
      const user = await this.prismaService.user.create({
        data: {
          email: dto.email,
          firstName: dto.firstName,
          lastName: dto.lastName,
          isPremium: dto.isPremium || false,
          hash: "temporary_hash", // You need to add password hashing
        },
      });
      
      // Remove hash from response
      const { hash, ...result } = user;
      return result;
    } catch (error) {
      throw error;
    }
  }

  login() {
    return 'I am a login endpoint';
  }
}