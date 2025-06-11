import { Injectable } from "@nestjs/common";

@Injectable()
export class AuthService{
     login() {
    return 'I am a login endpoint';
  }
  signup() {
    return 'I am a signup endpoint';
  }
}