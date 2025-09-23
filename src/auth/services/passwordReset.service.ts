import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as crypto from 'crypto';
import * as argon2 from 'argon2';
import { EmailService } from 'src/email/email.service';

@Injectable()
export class PasswordResetService {
  constructor(private readonly prisma: PrismaService , private readonly emailService : EmailService) {}

  async requestPasswordReset(email: string): Promise<{ message: string; resetToken?: string }> {
    try {
      // Check if user exists
      const user = await this.prisma.user.findUnique({
        where: { email },
        select: { id: true, email: true }
      });

      if (!user) {
        throw new NotFoundException('No account found with this email address');
      }

      // Generate secure reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetExpires = new Date(Date.now() + 3600000); // 1 hour from now

      // Save reset token to database
      await this.prisma.user.update({
        where: { email },
        data: {
          passwordResetToken: resetToken,
          passwordResetExpires: resetExpires
        }
      });

      // In production, send email here
       await this.emailService.sendPasswordResetEmail(user.email, resetToken);
      
      // For development - log the reset link
      console.log(`🔐 Password Reset Link: http://localhost:3000/reset-password?token=${resetToken}`);
      console.log(`📧 Reset link sent to: ${email}`);

      return {
        message: 'Password reset link has been sent to your email',
        resetToken // Remove this in production
      };

    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to process password reset request');
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    try {
      // Find user with valid reset token
      const user = await this.prisma.user.findFirst({
        where: {
          passwordResetToken: token,
          passwordResetExpires: {
            gt: new Date() // Token must not be expired
          }
        },
        select: { id: true, email: true }
      });

      if (!user) {
        throw new BadRequestException('Invalid or expired reset token');
      }

      // Hash new password;
    const hashedPassword = await argon2.hash(newPassword);

      // Update password and clear reset token
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash: hashedPassword,
          passwordResetToken: null,
          passwordResetExpires: null
        }
      });

      console.log(`✅ Password reset successful for: ${user.email}`);

      return {
        message: 'Password has been reset successfully'
      };

    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to reset password');
    }
  }

}