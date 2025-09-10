import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AuthController } from '../../auth.controller';
import { AuthService } from '../../auth.service';
import { LoginService } from '../login.service';
import { SignupService } from '../signup.service';
import { RefreshTokenService } from '../refresh-token.service';
import { LogoutService } from '../logout.service';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../../prisma/prisma.service';

describe('Simple Login Test', () => {
  let app: INestApplication;

  // Mock services with simple functions
  const mockLoginService = {
    loginWithCookies: jest.fn(),
  };

  const mockAuthService = {
    login: jest.fn(),
  };

  const mockSignupService = {
    signUp: jest.fn(),
  };

  const mockRefreshTokenService = {
    refreshToken: jest.fn(),
  };

  const mockLogoutService = {
    logout: jest.fn(),
  };

  beforeAll(async () => {
    // Create a simple test module
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: LoginService, useValue: mockLoginService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: SignupService, useValue: mockSignupService },
        { provide: RefreshTokenService, useValue: mockRefreshTokenService },
        { provide: LogoutService, useValue: mockLogoutService },
        { provide: JwtService, useValue: { sign: jest.fn(), verify: jest.fn() } },
        { provide: PrismaService, useValue: { user: { findUnique: jest.fn() } } },
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /auth/login', () => {
    it('should login successfully', async () => {
      // What we expect back from a successful login
      const mockResponse = {
        user: { id: 1, email: 'test@test.com' },
        accessToken: 'fake-token'
      };

      // Tell our mock what to return
      mockLoginService.loginWithCookies.mockResolvedValue(mockResponse);

      // Send a login request
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@test.com',
          password: 'password123'
        })
        .expect(200);

      // Check we got what we expected
      expect(response.body.user.email).toBe('test@test.com');
      expect(response.body.accessToken).toBe('fake-token');
    });

    it('should fail with invalid email', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'not-an-email',
          password: 'password123'
        })
        .expect(400);
    });

    it('should fail with missing password', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@test.com'
          // No password
        })
        .expect(400);
    });
  });
});