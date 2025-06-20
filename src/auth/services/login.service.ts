
import { Injectable, ForbiddenException, Logger } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { LoginDto } from "../dto/login.dto";
import * as argon from 'argon2';
import { JwtService } from "@nestjs/jwt"; // Import JwtService for JWT functionality

@Injectable()
export class LoginService {
  private readonly logger = new Logger(LoginService.name);

  constructor(private prismaService: PrismaService,
              private readonly jwtService: JwtService  // Import JwtService for JWT functionality
  ) {}

  async login(dto: LoginDto) {
    try {

            // Find user by email
      const user = await this.prismaService.user.findUnique({
        where: { email: dto.email },
      });

      // Check if user exists
      if (!user) {
        this.logger.warn(`Login failed: User not found for email ${dto.email}`);
        throw new ForbiddenException('Invalid email or password');
      }

      
            // Generate JWT token
      const payload = { 
        role: user.role, 
        email: user.email,
        id: user.id // Make sure to include id for your product creation
      };
      
     const access_token = await this.jwtService.signAsync(payload)

      this.logger.log(`Login attempt for email: ${dto.email}`);


      // Check if account is deleted
      if (user.isDeleted) {
        this.logger.warn(`Login attempt on deleted account: ${dto.email}`);
        throw new ForbiddenException('Account has been deactivated');
      }

      // Verify password
      const isPasswordValid = await argon.verify(user.passwordHash, dto.password);

      if (!isPasswordValid) {
        this.logger.warn(`Invalid password for email ${dto.email}`);
        throw new ForbiddenException('Invalid email or password');
      }

       
      this.logger.log(`User logged in successfully: ${user.id}`);

      // Return user without sensitive information
      const { passwordHash, isDeleted, ...safeUser } = user;
      
      return {
        success: true,
        message: 'Login successful',
        user: safeUser,
        access_token, 
        remainingSlots: safeUser.availableSlots - safeUser.usedSlots
      };

    } catch (error) {
      this.logger.error(`Login error: ${error.message}`, error.stack);
      
      // Re-throw known exceptions
      if (error instanceof ForbiddenException) {
        throw error;
      }

      // Handle unexpected errors
      throw new ForbiddenException('An error occurred during login');
    }
  }
}