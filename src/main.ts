import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable cookie parser middleware
  app.use(cookieParser());
  
  // Enable CORS for frontend connection
  app.enableCors({
    origin: 'http://localhost:3000', // Next.js default port
    credentials: true,
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

