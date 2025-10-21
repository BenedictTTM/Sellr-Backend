# Store Page Backend Implementation Guide

## Overview

This guide shows you how to add the required endpoints to support unique store pages for each user.

## Required Endpoints

### 1. Get User by Username (Public)

**File:** `Backend/src/user/user.controller.ts`

Add this method to your existing UserController:

```typescript
@Get('username/:username')
@Public() // Make this public so anyone can view stores
async getUserByUsername(@Param('username') username: string) {
  return this.userService.findByUsername(username);
}
```

**File:** `Backend/src/user/user.service.ts`

Add this method to your existing UserService:

```typescript
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
      rating: true,
      totalRatings: true,
      createdAt: true,
      // Don't expose sensitive data like email, password, etc.
    },
  });

  if (!user) {
    throw new NotFoundException('User not found');
  }

  return user;
}
```

### 2. Get Products by User ID (Public)

**File:** `Backend/src/product/product.controller.ts`

Add this method to your existing ProductController:

```typescript
@Get('user/:userId')
@Public() // Make this public so anyone can view store products
async getProductsByUser(@Param('userId') userId: string) {
  return this.productService.findByUserId(+userId);
}
```

**File:** `Backend/src/product/product.service.ts`

Add this method to your existing ProductService:

```typescript
async findByUserId(userId: number) {
  return this.prismaService.product.findMany({
    where: {
      userId: userId,
      isActive: true, // Only show active products
      isSold: false, // Only show available products
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
          rating: true,
          totalRatings: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}
```

### 3. Add @Public() Decorator (if not already exists)

**File:** `Backend/src/decorators/public.decorator.ts`

If you don't have this decorator, create it:

```typescript
import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
```

**File:** `Backend/src/guards/auth.guard.ts`

Update your AuthGuard to respect the @Public() decorator:

```typescript
import { Injectable, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard as PassportAuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class AuthGuard extends PassportAuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true; // Allow public access without authentication
    }

    return super.canActivate(context);
  }
}
```

## Testing the Endpoints

### Test with cURL:

```bash
# Get user by username
curl http://localhost:3001/users/username/johndoe

# Get products by user ID
curl http://localhost:3001/products/user/1
```

### Expected Responses:

**GET /users/username/johndoe:**

```json
{
  "id": 1,
  "username": "johndoe",
  "firstName": "John",
  "lastName": "Doe",
  "storeName": "John's Electronics",
  "profilePic": "https://...",
  "rating": 4.5,
  "totalRatings": 23,
  "createdAt": "2025-01-01T00:00:00.000Z"
}
```

**GET /products/user/1:**

```json
[
  {
    "id": 1,
    "title": "Product 1",
    "description": "...",
    "images": ["..."],
    "originalPrice": 100,
    "discountedPrice": 80,
    "stock": 10,
    "isActive": true,
    "isSold": false,
    "user": {
      "id": 1,
      "username": "johndoe",
      "firstName": "John",
      "lastName": "Doe",
      "storeName": "John's Electronics",
      "profilePic": "https://...",
      "rating": 4.5,
      "totalRatings": 23
    }
  }
]
```

## Security Considerations

✅ **Username validation:** Ensure usernames are unique and sanitized
✅ **No sensitive data:** Don't expose email, password, or other sensitive info
✅ **Rate limiting:** Consider adding rate limiting to public endpoints
✅ **Active products only:** Only show active, non-sold products in public store
✅ **CORS:** Ensure CORS is properly configured for your frontend domain

## URL Structure

Each user will have a unique store URL based on their username:

- `https://yoursite.com/store/johndoe`
- `https://yoursite.com/store/janedoe`
- `https://yoursite.com/store/electronicsstore`

## Next Steps

1. ✅ Add the endpoints to your backend
2. ✅ Test with Postman or cURL
3. ✅ Restart your backend server
4. ✅ Test the frontend store page
5. ✅ Share your store link with customers!

## Example Usage

Once implemented, users can:

- Share their store link: `https://yoursite.com/store/johndoe`
- Copy the link from the "Share Store" button
- Post it on social media
- Send it to customers via WhatsApp, email, etc.

The store page will show:

- Store name and owner info
- Profile picture or logo
- All available products in a grid
- Product count
- Professional, customer-facing design
