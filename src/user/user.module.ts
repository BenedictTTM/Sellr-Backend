import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { AuthGuard } from '../guards/auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { PrismaModule } from '../prisma/prisma.module'; // Adjust the import path as necessary
import { AuthModule } from 'src/auth/auth.module';
@Module({
    imports: [PrismaModule , AuthModule], // Import any necessary modules here, e.g., PrismaModule if needed
    controllers: [UserController],
    providers: [UserService , AuthGuard, RolesGuard], // Include AuthGuard and RolesGuard if needed
    exports: [UserService],// Export UserService if needed in other modules
})
export class UserModule {}
