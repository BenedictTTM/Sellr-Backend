import { Injectable } from "@nestjs/common";
import { SignupService } from "./services/signup.service";
import { LoginService } from "./services/login.service"
import { SignUpDto } from "./dto/signUp.dto";
import { LoginDto } from "./dto/login.dto"


export interface User {
  id: number;
  createdAt: Date;
  email: string;
  firstName: string;
  lastName: string;
  premiumTier: string;
  availableSlots: number;
  usedSlots: number;
  role: string;
}

@Injectable()
export class AuthService {
  constructor(
    private signupService: SignupService,
    private loginService: LoginService
  ) {}

  async signup(dto: SignUpDto) {
    return this.signupService.signup(dto);
  }

  async login(dto: LoginDto) {
    return this.loginService.login(dto);
  }
}