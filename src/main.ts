import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import { json } from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable cookie parser middleware
  app.use(cookieParser());

  // Raw body parser for webhook signature verification
  // This stores the raw body on req.rawBody for routes that need it (like webhooks)
  app.use(
    json({
      verify: (req: any, res, buf) => {
        req.rawBody = buf.toString('utf8');
      },
    }),
  );
  
  // Enable CORS for frontend connection
  const allowedOrigins = [
    'http://localhost:3000',
    'https://sellr-front-end.vercel.app',
    process.env.FRONTEND_URL,
  ].filter(Boolean);
  
  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.some(allowed => origin.startsWith(allowed))) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-paystack-signature'],
  });
  
  // Enable global validation pipes
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,           // Remove properties that don't have decorators
    forbidNonWhitelisted: false, // CHANGE: Set to false to allow form-data fields
    transform: true,           // Transform payloads to DTO instances
    disableErrorMessages: false, // Show detailed error messages
    validateCustomDecorators: true, // Enable custom validation decorators
    transformOptions: {
      enableImplicitConversion: true, // CHANGE: This helps convert strings to numbers
    },
    // ADD: New option to handle form-data better
    skipMissingProperties: false,
    // ADD: New option to ensure all required fields are validated
    skipNullProperties: false,
    // ADD: New option to handle undefined values
    skipUndefinedProperties: false,
  }));
  
  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`🚀 Application is running on port ${port}`);
}
bootstrap();

