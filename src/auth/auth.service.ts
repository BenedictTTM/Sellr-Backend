import { Injectable } from "@nestjs/common";
//import {User , Bookmark} from "@prisma/client";

@Injectable()
export class AuthService{
     login() {
    return 'I am a login endpoint';
  }
  signup() {
    return 'I am a signup endpoint';
  }
}