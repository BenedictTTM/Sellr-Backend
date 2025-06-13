import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
//import {User , Bookmark} from "@prisma/client";

export interface User {
  id: number;
  createdAt: Date;
  email: string;
  firstName: string;
  lastName: string;
  isPremium: boolean;
}
@Injectable()
export class AuthService{
     constructor(private prismaService: PrismaService) {}

    signup() {
    return 'I am a signup endpoint';
  }
  login() {
    return 'I am a login endpoint';
  }

}