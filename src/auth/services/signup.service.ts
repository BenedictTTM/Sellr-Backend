import { Injectable, ConflictException, InternalServerErrorException, Logger } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { SignUpDto } from "../dto/signUp.dto";
import * as argon from 'argon2';

@Injectable()
export class SignupService {
  private readonly logger = new Logger(SignupService.name);

  constructor(private prismaService: PrismaService) {}

  async signup(dto: SignUpDto) {
    try {
      this.logger.log(`Attempting to create user with email: ${dto.email}`);

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
          username: dto.email,
          firstName: dto.firstName,
          lastName: dto.lastName,
          premiumTier: 'FREE',
          availableSlots: 5,
          usedSlots: 0,
          role: 'USER',
        },
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

      this.logger.log(`User created successfully with ID: ${user.id}`);
      
      return {
        success: true,
        message: 'Account created successfully',
        user,
        remainingSlots: user.availableSlots - user.usedSlots
      };

    } catch (error) {
      return this.handleSignupError(error, dto.email);
    }
  }

  private handleSignupError(error: any, email: string) {
    this.logger.error(`Error during user signup: ${error.message}`, error.stack);

    // Handle specific Prisma errors
    if (error.code === 'P2002') {
      const field = error.meta?.target?.[0] || 'field';
      throw new ConflictException(`${field} already exists`);
    }

    if (error.code === 'P2000') {
      throw new ConflictException('Input data is too long');
    }

    if (error.code === 'P2001') {
      throw new ConflictException('Required data not found');
    }

    // Handle known exceptions
    if (error instanceof ConflictException) {
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