# Shopping Cart System

## Overview

Enterprise-grade shopping cart system built with NestJS, Prisma ORM, and PostgreSQL. Implements best practices including transaction safety, comprehensive validation, proper error handling, and clear separation of concerns.

## Architecture

### Database Schema

```prisma
model Cart {
  id        Int        @id @default(autoincrement())
  userId    Int        @unique              // One cart per user
  user      User       @relation(...)
  items     CartItem[]
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt
  @@index([userId])                        // Query optimization
}

model CartItem {
  id        Int      @id @default(autoincrement())
  cartId    Int
  cart      Cart     @relation(...)
  productId Int
  product   Product  @relation(...)
  quantity  Int      @default(1)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  @@unique([cartId, productId])           // Prevent duplicates
  @@index([cartId])
  @@index([productId])
}
```

**Key Design Decisions:**

- **One Cart Per User**: Enforced by `@unique` constraint on `userId`
- **No Duplicate Products**: `@@unique([cartId, productId])` prevents adding the same product twice
- **Cascade Deletes**: When user or product is deleted, cart items are automatically removed
- **Optimized Queries**: Indexes on `userId`, `cartId`, and `productId` for fast lookups

### Module Structure

```
Backend/src/cart/
├── dto/
│   ├── add-to-cart.dto.ts       # Validation for adding items
│   ├── update-cart-item.dto.ts  # Validation for quantity updates
│   └── index.ts                 # DTO exports
├── cart.service.ts              # Business logic
├── cart.controller.ts           # REST API endpoints
└── cart.module.ts               # Module registration
```

## API Endpoints

### 1. Add to Cart

```http
POST /cart
Authorization: Required (AuthGuard)
Content-Type: application/json

Body:
{
  "productId": 5,
  "quantity": 2
}

Response (201 Created):
{
  "id": 1,
  "userId": 1,
  "items": [
    {
      "id": 1,
      "quantity": 2,
      "product": {
        "id": 5,
        "name": "Product Name",
        "price": 50.00,
        "stock": 10,
        "discount": 10
      },
      "itemTotal": 90.00
    }
  ],
  "subtotal": 90.00,
  "totalItems": 2,
  "createdAt": "2025-01-09T12:00:00Z",
  "updatedAt": "2025-01-09T12:30:00Z"
}
```

**Features:**

- Creates cart if user doesn't have one
- Updates quantity if product already in cart
- Validates product existence
- Checks stock availability
- Uses database transaction for atomicity

**Error Responses:**

- `400 Bad Request`: Insufficient stock or invalid quantity
- `401 Unauthorized`: Not authenticated
- `404 Not Found`: Product doesn't exist

### 2. Get Cart

```http
GET /cart
Authorization: Required (AuthGuard)

Response (200 OK):
{
  "id": 1,
  "userId": 1,
  "items": [...],
  "subtotal": 150.00,
  "totalItems": 5,
  "createdAt": "2025-01-09T12:00:00Z",
  "updatedAt": "2025-01-09T12:30:00Z"
}

// Or null if no cart exists
null
```

**Features:**

- Returns cart with all items and product details
- Calculates subtotal with discounts applied
- Returns null if cart doesn't exist
- Includes timestamps for cache management

### 3. Get Cart Item Count

```http
GET /cart/count
Authorization: Required (AuthGuard)

Response (200 OK):
{
  "count": 5
}
```

**Features:**

- Lightweight endpoint for header badge
- Returns total quantity across all items
- Returns 0 if no cart exists

### 4. Update Cart Item

```http
PATCH /cart/:itemId
Authorization: Required (AuthGuard)
Content-Type: application/json

Body:
{
  "quantity": 3
}

Response (200 OK):
{
  "id": 1,
  "userId": 1,
  "items": [...],
  "subtotal": 150.00,
  "totalItems": 5
}
```

**Features:**

- Updates quantity for specific cart item
- Validates stock before updating
- Verifies item belongs to authenticated user
- Returns updated cart with new totals

**Error Responses:**

- `400 Bad Request`: Insufficient stock
- `404 Not Found`: Item doesn't exist or doesn't belong to user

### 5. Remove Cart Item

```http
DELETE /cart/:itemId
Authorization: Required (AuthGuard)

Response (200 OK):
{
  "id": 1,
  "userId": 1,
  "items": [...],
  "subtotal": 100.00,
  "totalItems": 3
}
```

**Features:**

- Permanently deletes cart item
- Verifies item belongs to authenticated user
- Returns updated cart after removal

### 6. Clear Cart

```http
DELETE /cart
Authorization: Required (AuthGuard)

Response (200 OK):
{
  "id": 1,
  "userId": 1,
  "items": [],
  "subtotal": 0,
  "totalItems": 0
}
```

**Features:**

- Removes all items from cart
- Keeps cart entity (doesn't delete cart itself)
- Useful for post-checkout cleanup

## Business Logic

### Stock Validation

```typescript
// Before adding to cart
const product = await prisma.product.findUnique({
  where: { id: productId },
  select: { stock: true },
});

if (product.stock < quantity) {
  throw new BadRequestException('Insufficient stock');
}
```

### Duplicate Prevention

```typescript
// Check if product already in cart
const existingItem = await prisma.cartItem.findUnique({
  where: {
    cartId_productId: {
      cartId: cart.id,
      productId,
    },
  },
});

if (existingItem) {
  // Update quantity instead of creating new item
  await prisma.cartItem.update({
    where: { id: existingItem.id },
    data: { quantity: existingItem.quantity + quantity },
  });
}
```

### Transaction Safety

```typescript
// All cart operations wrapped in transaction
const result = await prisma.$transaction(async (tx) => {
  // Get or create cart
  // Validate stock
  // Add/update item
  // Return updated cart
});
```

### Price Calculation

```typescript
// Calculate effective price with discount
const effectivePrice = product.discount
  ? product.price * (1 - product.discount / 100)
  : product.price;

const itemTotal = effectivePrice * quantity;

// Calculate cart subtotal
const subtotal = items.reduce((total, item) => total + item.itemTotal, 0);
```

## Validation Rules

### AddToCartDto

```typescript
class AddToCartDto {
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  productId: number;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  quantity: number = 1; // Default value
}
```

**Rules:**

- `productId`: Must be positive integer
- `quantity`: Must be integer ≥ 1
- Type coercion with `@Type(() => Number)` handles string inputs

### UpdateCartItemDto

```typescript
class UpdateCartItemDto {
  @IsInt()
  @Min(1)
  @Type(() => Number)
  quantity: number;
}
```

**Rules:**

- `quantity`: Must be integer ≥ 1
- No default value (update must be explicit)

## Error Handling

### Standard Error Responses

#### NotFoundException (404)

```json
{
  "statusCode": 404,
  "message": "Product with ID 5 not found",
  "error": "Not Found"
}
```

#### BadRequestException (400)

```json
{
  "statusCode": 400,
  "message": "Insufficient stock. Only 3 items available",
  "error": "Bad Request"
}
```

#### UnauthorizedException (401)

```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

#### InternalServerErrorException (500)

```json
{
  "statusCode": 500,
  "message": "Failed to add item to cart",
  "error": "Internal Server Error"
}
```

### Error Handling Strategy

1. **Catch Known Errors**: Re-throw NotFoundException and BadRequestException
2. **Wrap Unknown Errors**: Convert to InternalServerErrorException
3. **Preserve Error Context**: Include original error message
4. **Log Errors**: (Future enhancement - add logging service)

## Security

### Authentication

- All endpoints protected with `@UseGuards(AuthGuard)`
- User ID extracted from JWT token in `req.user.id`
- No user ID in request body (prevents impersonation)

### Authorization

- Cart operations only affect authenticated user's cart
- CartItem updates verify ownership before modification
- No way to access or modify another user's cart

### Input Validation

- DTOs with class-validator decorators
- Type coercion prevents type confusion attacks
- Min/Max constraints prevent negative quantities
- Product existence validated before operations

## Performance Optimization

### Database Indexes

```prisma
@@index([userId])    // Fast cart lookups by user
@@index([cartId])    // Fast item lookups by cart
@@index([productId]) // Fast product stock checks
```

### Query Optimization

- Selective field loading with `select`
- Eager loading with `include` (avoid N+1 queries)
- Batched operations in transactions

### Caching Strategy (Future)

- Cache cart data with Redis
- Invalidate on cart modifications
- TTL: 15 minutes

## Testing Strategy

### Unit Tests (Future Implementation)

```typescript
describe('CartService', () => {
  describe('addToCart', () => {
    it('should create new cart if user has none');
    it('should update quantity if product already in cart');
    it('should throw NotFoundException for invalid product');
    it('should throw BadRequestException for insufficient stock');
  });

  describe('updateCartItem', () => {
    it('should update quantity successfully');
    it('should throw NotFoundException for non-existent item');
    it('should verify item belongs to user');
  });
});
```

### Integration Tests (Future Implementation)

```typescript
describe('CartController (e2e)', () => {
  it('/cart (POST) should add item to cart', async () => {
    const response = await request(app.getHttpServer())
      .post('/cart')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ productId: 1, quantity: 2 })
      .expect(201);

    expect(response.body.items).toHaveLength(1);
    expect(response.body.totalItems).toBe(2);
  });
});
```

## Usage Examples

### Adding Item to Cart

```typescript
// Frontend API call
const response = await fetch('/api/cart', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    productId: 5,
    quantity: 2,
  }),
});

const cart = await response.json();
console.log(`Cart total: GHS ${cart.subtotal}`);
```

### Displaying Cart Badge

```typescript
// Fetch cart count for header
const response = await fetch('/api/cart/count');
const { count } = await response.json();

// Update badge
<Badge>{count}</Badge>
```

### Updating Quantity

```typescript
// Update cart item quantity
await fetch(`/api/cart/${itemId}`, {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ quantity: 3 }),
});
```

## Future Enhancements

### Phase 1 (High Priority)

- [ ] Frontend cart UI (drawer/sidebar)
- [ ] Cart persistence across sessions
- [ ] Cart item stock validation on checkout
- [ ] Saved for later functionality

### Phase 2 (Medium Priority)

- [ ] Guest cart (localStorage → merge on login)
- [ ] Cart expiration (remove old items)
- [ ] Wishlist integration
- [ ] Cart analytics (abandonment tracking)

### Phase 3 (Low Priority)

- [ ] Multi-cart support (save multiple carts)
- [ ] Shared carts (collaborative shopping)
- [ ] Cart recommendations (based on items)
- [ ] Price drop notifications

## Troubleshooting

### Issue: Cart not found

**Cause**: User hasn't added any items yet
**Solution**: addToCart automatically creates cart on first item

### Issue: Duplicate product error

**Cause**: Trying to add same product twice
**Solution**: Service automatically updates quantity instead

### Issue: Insufficient stock error

**Cause**: Requested quantity exceeds available stock
**Solution**: Reduce quantity or wait for restock

### Issue: Cart item not found

**Cause**: Item deleted or doesn't belong to user
**Solution**: Refresh cart data from server

## Maintenance

### Database Migrations

```bash
# Create new migration
npx prisma migrate dev --name add_cart_system

# Apply migrations in production
npx prisma migrate deploy

# Reset database (development only)
npx prisma migrate reset
```

### Prisma Client Generation

```bash
# Generate Prisma Client after schema changes
npx prisma generate

# Sync schema without migration
npx prisma db push
```

## Contributing

### Code Style

- Follow NestJS conventions
- Use JSDoc comments for public methods
- Include error handling for all operations
- Write descriptive commit messages

### Pull Request Checklist

- [ ] Code follows style guidelines
- [ ] DTOs include validation decorators
- [ ] Services include error handling
- [ ] Controllers have proper HTTP status codes
- [ ] Documentation updated (if needed)
- [ ] Tests written (unit + integration)

## License

MIT

---

**Version**: 1.0.0  
**Last Updated**: January 9, 2025  
**Maintained By**: Sellr Development Team
