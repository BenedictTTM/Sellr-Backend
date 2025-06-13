import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { PrismaModule } from "../prisma/prisma.module"; // Ensure PrismaModule is imported

@Module({
    imports:[PrismaModule], // Import PrismaModule to use PrismaService
    controllers:[AuthController],
    providers:[AuthService]
})

export class AuthModule {}