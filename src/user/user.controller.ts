import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { UserService } from './user.service';
import { UserDto } from './dto/user.dto';

@Controller('users')
export class UserController {
    constructor(private readonly userService: UserService) {}

    @Get()
    getAllUsers() {
        return this.userService.getAllUsers();
    }

    @Get(':id')
    getUserById(@Param('id', ParseIntPipe) id: number) {
        return this.userService.getUserById(id);
    }

    @Get(':id/profile')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.userService.findOne(id);
    }

    @Patch(':id')
    updateUser(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateUserDto: UserDto
    ) {
        return this.userService.update(id, updateUserDto);
    }
}