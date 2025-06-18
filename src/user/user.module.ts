import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
    controllers: [UserController],
    providers: [UserService],
    exports: [UserService],// Export UserService if needed in other modules
})
export class UserModule {}
