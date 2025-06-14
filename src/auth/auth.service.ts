import { Injectable, ForbiddenException, ConflictException, InternalServerErrorException, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AuthDto } from "./dto/auth.dto";
import * as argon from 'argon2';

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
  private readonly logger = new Logger(AuthService.name);
  constructor(private prismaService: PrismaService) {}

  async signup(dto: AuthDto) {
    try {
      // Check if the user already exists
      const existingUser = await this.prismaService.user.findUnique({
        where: { email: dto.email },
      });

      if (existingUser) {
        this.logger.warn(`User registration failed: Email ${dto.email} already exists`);
        throw new ConflictException('User with this email already exists');
      }
           // Hash the password using argon2
      const passwordHash = await argon.hash(dto.password);
      
      const user = await this.prismaService.user.create({
        data: {
          email: dto.email,
          passwordHash,
          firstName: dto.firstName,
          lastName: dto.lastName,
          premiumTier: 'FREE', // Default to FREE tier
          availableSlots: 5,   // Default 5 slots for free users
          usedSlots: 0,        // Start with 0 used slots
          role: 'USER'  ,       // Default role
        },
        
        // Select only the fields you want to return
        select: {
          id: true,
          createdAt: true,
          email: true,
          firstName: true,
          lastName: true,
          premiumTier: true,
          availableSlots: true,
          usedSlots: true,
          role: true,
          }
      });

      
      return user 
    } catch (error) {
       this.logger.error(`Error during user signup: ${error.message}`, error.stack);

      // Handle specific Prisma errors
      if (error.code === 'P2002') {
        // Unique constraint violation
        const field = error.meta?.target?.[0] || 'field';
        throw new ConflictException(`${field} already exists`);
      }

      if (error.code === 'P2000') {
        // Value too long for column
        throw new ForbiddenException('Input data is too long');
      }

      if (error.code === 'P2001') {
        // Record not found
        throw new ForbiddenException('Required data not found');
      }
     
         // Handle known exceptions
      if (error instanceof ConflictException || 
          error instanceof ForbiddenException) {
        throw error;
      }

      // Handle password hashing errors
      if (error.message?.includes('argon2')) {
        this.logger.error('Password hashing failed', error.stack);
        throw new InternalServerErrorException('Failed to process password');
      }

      // Handle database connection errors
      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        this.logger.error('Database connection failed', error.stack);
        throw new InternalServerErrorException('Database temporarily unavailable');
      }

       // Fallback for unexpected errors
      this.logger.error('Unexpected error during signup', error.stack);
      throw new InternalServerErrorException('An unexpected error occurred during registration');
    }
  }

  login() {
    return 'I am a login endpoint';
  }
}