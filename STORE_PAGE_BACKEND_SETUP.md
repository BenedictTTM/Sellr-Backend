# Store Page Backend Setup Guide

## 📋 Overview

This guide shows you how to add the necessary backend endpoints to support the public store pages feature.

## 🎯 Required Endpoints

### 1. Get User by Username

**Endpoint:** `GET /users/username/:username`
**Purpose:** Fetch user profile by username for public store display
**Access:** Public (no authentication required)

### 2. Get Products by User ID

**Endpoint:** `GET /products/user/:userId`
**Purpose:** Fetch all products for a specific user
**Access:** Public (no authentication required)

---

## 🔧 Implementation Steps

### Step 1: Add Controller Method to `user.controller.ts`

```typescript
// Location: Backend/src/user/user.controller.ts

import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { Public } from '../decorators/public.decorator'; // If you have this decorator

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // ... existing methods ...

  /**
   * Get user by username (Public endpoint for store pages)
   */
  @Get('username/:username')
  @Public() // Make this endpoint public - anyone can access
  async getUserByUsername(@Param('username') username: string) {
    return this.userService.findByUsername(username);
  }
}
```

---

### Step 2: Add Service Method to `user.service.ts`

```typescript
// Location: Backend/src/user/user.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private prismaService: PrismaService) {}

  // ... existing methods ...

  /**
   * Find user by username (for public store pages)
   */
  async findByUsername(username: string) {
    const user = await this.prismaService.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        storeName: true,
        profilePic: true,
        // Don't expose sensitive data like email, password, etc.
      },
    });

    if (!user) {
      throw new NotFoundException(`User with username "${username}" not found`);
    }

    return user;
  }
}
```

---

### Step 3: Add Controller Method to `product.controller.ts`

```typescript
// Location: Backend/src/product/product.controller.ts

import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { Public } from '../decorators/public.decorator';

@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  // ... existing methods ...

  /**
   * Get all products for a specific user (Public endpoint for store pages)
   */
  @Get('user/:userId')
  @Public() // Make this endpoint public
  async getProductsByUser(@Param('userId', ParseIntPipe) userId: number) {
    return this.productService.findByUserId(userId);
  }
}
```

---

### Step 4: Add Service Method to `product.service.ts`

```typescript
// Location: Backend/src/product/product.service.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProductService {
  constructor(private prismaService: PrismaService) {}

  // ... existing methods ...

  /**
   * Find all products for a specific user (for public store pages)
   */
  async findByUserId(userId: number) {
    return this.prismaService.product.findMany({
      where: {
        userId,
        isActive: true, // Only show active products
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            storeName: true,
            profilePic: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}
```

---

## 🔒 Making Endpoints Public

### Option 1: Using @Public() Decorator

If you have a custom `@Public()` decorator (recommended):

```typescript
// Backend/src/decorators/public.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
```

Then update your AuthGuard to check for this metadata:

```typescript
// Backend/src/guards/auth.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true; // Allow public access
    }

    // ... your existing auth logic ...
  }
}
```

### Option 2: Using @SkipAuth() or Similar

If you're using Passport.js with JWT:

```typescript
@Get('username/:username')
@UseGuards() // Don't use AuthGuard here
async getUserByUsername(@Param('username') username: string) {
  return this.userService.findByUsername(username);
}
```

---

## ✅ Testing the Endpoints

### Test 1: Get User by Username

```bash
# Request
curl http://localhost:3001/users/username/johndoe

# Expected Response
{
  "id": 1,
  "username": "johndoe",
  "firstName": "John",
  "lastName": "Doe",
  "storeName": "John's Electronics",
  "profilePic": "https://cloudinary.com/..."
}
```

### Test 2: Get Products by User

```bash
# Request
curl http://localhost:3001/products/user/1

# Expected Response
[
  {
    "id": 1,
    "title": "Laptop",
    "description": "...",
    "discountedPrice": 999.99,
    "images": ["..."],
    "user": {
      "id": 1,
      "username": "johndoe",
      "storeName": "John's Electronics"
    }
  },
  // ... more products
]
```

---

## 🚀 Quick Implementation Checklist

- [ ] Add `getUserByUsername()` to `user.controller.ts`
- [ ] Add `findByUsername()` to `user.service.ts`
- [ ] Add `getProductsByUser()` to `product.controller.ts`
- [ ] Add `findByUserId()` to `product.service.ts`
- [ ] Make endpoints public using `@Public()` decorator
- [ ] Test endpoints with curl or Postman
- [ ] Verify no sensitive data is exposed
- [ ] Test from frontend store page

---

## 🔐 Security Notes

### ✅ Safe to Expose:

- username
- firstName, lastName
- storeName
- profilePic
- product information

### ❌ Never Expose:

- password (hashed or not)
- email
- phone number
- private user settings
- authentication tokens

---

## 📝 Database Indexes (Optional Performance Boost)

Add index on username for faster lookups:

```prisma
// Backend/prisma/schema.prisma

model User {
  id          Int     @id @default(autoincrement())
  username    String  @unique  // Already has implicit index
  // ... other fields

  @@index([username]) // Explicit index for faster queries
}
```

Run migration:

```bash
cd Backend
npx prisma migrate dev --name add_username_index
```

---

## 🎉 Done!

Your store pages are now fully functional with backend support! Each user can share their store URL like:

- `https://yoursite.com/store/johndoe`
- `https://yoursite.com/store/janedoe`
- `https://yoursite.com/store/techstore`

Users can click the "Share Store" button to copy and share their unique store link! 🚀
