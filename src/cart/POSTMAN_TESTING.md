# Cart API - Postman Testing Guide

## Prerequisites

1. **Backend server running** on `http://localhost:3001`
2. **PostgreSQL database** running with cart tables migrated
3. **Authentication token** (You need to login first to get the accessToken cookie)
4. **At least one product** in the database to add to cart

---

## Step 1: Get Authentication Token

### Login Request

**Endpoint:** `POST http://localhost:3001/auth/login`

**Headers:**

```
Content-Type: application/json
```

**Body (JSON):**

```json
{
  "email": "your-email@example.com",
  "password": "your-password"
}
```

**Expected Response (200 OK):**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "username": "john_doe"
    }
  }
}
```

**Important:**

- The response will set an `accessToken` cookie
- In Postman, go to **Cookies** (below Send button) to see it
- Copy the cookie value or let Postman manage it automatically
- This cookie is required for all cart endpoints

---

## Step 2: Add Item to Cart

### Add to Cart Request

**Endpoint:** `POST http://localhost:3001/cart`

**Headers:**

```
Content-Type: application/json
Cookie: accessToken=YOUR_TOKEN_HERE
```

**Body (JSON):**

```json
{
  "productId": 1,
  "quantity": 2
}
```

**Expected Response (201 Created):**

```json
{
  "id": 1,
  "userId": 1,
  "items": [
    {
      "id": 1,
      "quantity": 2,
      "product": {
        "id": 1,
        "title": "Product Name",
        "description": "Product description",
        "originalPrice": 100.0,
        "discountedPrice": 80.0,
        "imageUrl": ["image1.jpg"],
        "stock": 50
      },
      "itemTotal": 160.0
    }
  ],
  "subtotal": 160.0,
  "totalItems": 2,
  "createdAt": "2025-01-09T12:00:00.000Z",
  "updatedAt": "2025-01-09T12:00:00.000Z"
}
```

**Test Variations:**

1. **Add different product:**

```json
{
  "productId": 2,
  "quantity": 1
}
```

2. **Add more quantity of existing product:**

```json
{
  "productId": 1,
  "quantity": 3
}
```

This will update existing item (quantity becomes 5 total)

3. **Test validation - Invalid product ID:**

```json
{
  "productId": 9999,
  "quantity": 1
}
```

Expected: `404 Not Found` - Product not found

4. **Test validation - Insufficient stock:**

```json
{
  "productId": 1,
  "quantity": 1000
}
```

Expected: `400 Bad Request` - Insufficient stock

5. **Test validation - Invalid quantity:**

```json
{
  "productId": 1,
  "quantity": 0
}
```

Expected: `400 Bad Request` - Quantity must be at least 1

6. **Test validation - Missing fields:**

```json
{
  "productId": 1
}
```

Expected: `201 Created` - Default quantity is 1

---

## Step 3: Get Cart

### Get Cart Request

**Endpoint:** `GET http://localhost:3001/cart`

**Headers:**

```
Cookie: accessToken=YOUR_TOKEN_HERE
```

**No Body Required**

**Expected Response (200 OK):**

```json
{
  "id": 1,
  "userId": 1,
  "items": [
    {
      "id": 1,
      "quantity": 5,
      "product": {
        "id": 1,
        "title": "Product Name",
        "originalPrice": 100.0,
        "discountedPrice": 80.0,
        "stock": 50
      },
      "itemTotal": 400.0
    },
    {
      "id": 2,
      "quantity": 1,
      "product": {
        "id": 2,
        "title": "Another Product",
        "originalPrice": 50.0,
        "discountedPrice": 50.0,
        "stock": 20
      },
      "itemTotal": 50.0
    }
  ],
  "subtotal": 450.0,
  "totalItems": 6,
  "createdAt": "2025-01-09T12:00:00.000Z",
  "updatedAt": "2025-01-09T12:15:00.000Z"
}
```

**If cart is empty:**

```json
null
```

---

## Step 4: Get Cart Item Count

### Get Count Request

**Endpoint:** `GET http://localhost:3001/cart/count`

**Headers:**

```
Cookie: accessToken=YOUR_TOKEN_HERE
```

**Expected Response (200 OK):**

```json
{
  "count": 6
}
```

**If cart is empty:**

```json
{
  "count": 0
}
```

---

## Step 5: Update Cart Item Quantity

### Update Quantity Request

**Endpoint:** `PATCH http://localhost:3001/cart/:itemId`

Replace `:itemId` with the actual cart item ID (e.g., `1`)

**Example:** `PATCH http://localhost:3001/cart/1`

**Headers:**

```
Content-Type: application/json
Cookie: accessToken=YOUR_TOKEN_HERE
```

**Body (JSON):**

```json
{
  "quantity": 3
}
```

**Expected Response (200 OK):**

```json
{
  "id": 1,
  "userId": 1,
  "items": [
    {
      "id": 1,
      "quantity": 3,
      "product": {
        "id": 1,
        "title": "Product Name",
        "originalPrice": 100.0,
        "discountedPrice": 80.0
      },
      "itemTotal": 240.0
    }
  ],
  "subtotal": 240.0,
  "totalItems": 3
}
```

**Test Variations:**

1. **Increase quantity:**

```json
{
  "quantity": 10
}
```

2. **Decrease quantity:**

```json
{
  "quantity": 1
}
```

3. **Test validation - Zero quantity:**

```json
{
  "quantity": 0
}
```

Expected: `400 Bad Request` - Quantity must be at least 1

4. **Test validation - Exceeds stock:**

```json
{
  "quantity": 1000
}
```

Expected: `400 Bad Request` - Insufficient stock

5. **Test authorization - Wrong item ID:**

```
PATCH http://localhost:3001/cart/999
```

Expected: `404 Not Found` - Cart item not found

---

## Step 6: Remove Cart Item

### Remove Item Request

**Endpoint:** `DELETE http://localhost:3001/cart/:itemId`

**Example:** `DELETE http://localhost:3001/cart/1`

**Headers:**

```
Cookie: accessToken=YOUR_TOKEN_HERE
```

**No Body Required**

**Expected Response (200 OK):**

```json
{
  "id": 1,
  "userId": 1,
  "items": [
    {
      "id": 2,
      "quantity": 1,
      "product": {
        "id": 2,
        "title": "Another Product"
      },
      "itemTotal": 50.0
    }
  ],
  "subtotal": 50.0,
  "totalItems": 1
}
```

**If last item removed:**

```json
{
  "id": 1,
  "userId": 1,
  "items": [],
  "subtotal": 0,
  "totalItems": 0
}
```

**Test Variations:**

1. **Remove non-existent item:**

```
DELETE http://localhost:3001/cart/999
```

Expected: `404 Not Found`

2. **Remove item from another user's cart:**
   (Login as different user, try to delete item from first user's cart)
   Expected: `404 Not Found`

---

## Step 7: Clear Cart

### Clear Cart Request

**Endpoint:** `DELETE http://localhost:3001/cart`

**Headers:**

```
Cookie: accessToken=YOUR_TOKEN_HERE
```

**No Body Required**

**Expected Response (200 OK):**

```json
{
  "id": 1,
  "userId": 1,
  "items": [],
  "subtotal": 0,
  "totalItems": 0,
  "createdAt": "2025-01-09T12:00:00.000Z",
  "updatedAt": "2025-01-09T12:30:00.000Z"
}
```

---

## Complete Test Flow

### Scenario: Full Cart Journey

1. **Login** to get authentication token
2. **Add Item 1** (Product ID: 1, Quantity: 2)
3. **Add Item 2** (Product ID: 2, Quantity: 1)
4. **Get Cart** - Verify 2 items, total quantity 3
5. **Get Count** - Should return 3
6. **Update Item 1** - Change quantity to 5
7. **Get Cart** - Verify quantity updated, new subtotal
8. **Remove Item 2** - Delete second item
9. **Get Cart** - Verify only 1 item remains
10. **Clear Cart** - Remove all items
11. **Get Cart** - Should return null or empty cart

---

## Error Testing

### 1. Unauthorized Access (No Token)

**Endpoint:** `GET http://localhost:3001/cart`

**Headers:**

```
(No Cookie header)
```

**Expected Response (401 Unauthorized):**

```json
{
  "message": "Unauthorized",
  "statusCode": 401
}
```

### 2. Invalid Token

**Headers:**

```
Cookie: accessToken=invalid_token_here
```

**Expected Response (401 Unauthorized):**

```json
{
  "message": "Unauthorized",
  "statusCode": 401
}
```

### 3. Malformed Request Body

**Endpoint:** `POST http://localhost:3001/cart`

**Body:**

```json
{
  "productId": "not-a-number",
  "quantity": "abc"
}
```

**Expected Response (400 Bad Request):**

```json
{
  "message": [
    "productId must be a positive number",
    "quantity must be a number conforming to the specified constraints"
  ],
  "error": "Bad Request",
  "statusCode": 400
}
```

---

## Postman Collection JSON

Copy this into Postman (Import > Raw Text):

```json
{
  "info": {
    "name": "Sellr - Cart API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Auth",
      "item": [
        {
          "name": "Login",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"email\": \"user@example.com\",\n  \"password\": \"password123\"\n}"
            },
            "url": {
              "raw": "http://localhost:3001/auth/login",
              "protocol": "http",
              "host": ["localhost"],
              "port": "3001",
              "path": ["auth", "login"]
            }
          }
        }
      ]
    },
    {
      "name": "Cart",
      "item": [
        {
          "name": "Add to Cart",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"productId\": 1,\n  \"quantity\": 2\n}"
            },
            "url": {
              "raw": "http://localhost:3001/cart",
              "protocol": "http",
              "host": ["localhost"],
              "port": "3001",
              "path": ["cart"]
            }
          }
        },
        {
          "name": "Get Cart",
          "request": {
            "method": "GET",
            "header": [],
            "url": {
              "raw": "http://localhost:3001/cart",
              "protocol": "http",
              "host": ["localhost"],
              "port": "3001",
              "path": ["cart"]
            }
          }
        },
        {
          "name": "Get Cart Count",
          "request": {
            "method": "GET",
            "header": [],
            "url": {
              "raw": "http://localhost:3001/cart/count",
              "protocol": "http",
              "host": ["localhost"],
              "port": "3001",
              "path": ["cart", "count"]
            }
          }
        },
        {
          "name": "Update Cart Item",
          "request": {
            "method": "PATCH",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"quantity\": 5\n}"
            },
            "url": {
              "raw": "http://localhost:3001/cart/1",
              "protocol": "http",
              "host": ["localhost"],
              "port": "3001",
              "path": ["cart", "1"]
            }
          }
        },
        {
          "name": "Remove Cart Item",
          "request": {
            "method": "DELETE",
            "header": [],
            "url": {
              "raw": "http://localhost:3001/cart/1",
              "protocol": "http",
              "host": ["localhost"],
              "port": "3001",
              "path": ["cart", "1"]
            }
          }
        },
        {
          "name": "Clear Cart",
          "request": {
            "method": "DELETE",
            "header": [],
            "url": {
              "raw": "http://localhost:3001/cart",
              "protocol": "http",
              "host": ["localhost"],
              "port": "3001",
              "path": ["cart"]
            }
          }
        }
      ]
    }
  ]
}
```

---

## Tips for Testing in Postman

### 1. Cookie Management

**Option A: Automatic (Recommended)**

- Postman automatically manages cookies after login
- Just login once, then all subsequent requests will include the cookie

**Option B: Manual**

- After login, go to **Cookies** (below Send button)
- Copy the `accessToken` value
- Add it manually to each request header:
  ```
  Cookie: accessToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  ```

### 2. Environment Variables

Create a Postman Environment:

- Variable: `baseUrl` = `http://localhost:3001`
- Variable: `productId` = `1`
- Variable: `cartItemId` = `1`

Then use: `{{baseUrl}}/cart`

### 3. Tests (Automated Validation)

Add to the **Tests** tab of each request:

**For Add to Cart:**

```javascript
pm.test('Status code is 201', function () {
  pm.response.to.have.status(201);
});

pm.test('Response has items array', function () {
  var jsonData = pm.response.json();
  pm.expect(jsonData.items).to.be.an('array');
});

pm.test('Subtotal is calculated', function () {
  var jsonData = pm.response.json();
  pm.expect(jsonData.subtotal).to.be.a('number');
});
```

**For Get Cart:**

```javascript
pm.test('Status code is 200', function () {
  pm.response.to.have.status(200);
});

pm.test('Total items matches sum', function () {
  var jsonData = pm.response.json();
  if (jsonData && jsonData.items) {
    var sum = jsonData.items.reduce((acc, item) => acc + item.quantity, 0);
    pm.expect(jsonData.totalItems).to.eql(sum);
  }
});
```

### 4. Pre-request Scripts

**Get Product ID from Database:**

```javascript
// If you have a "Get Products" endpoint
pm.sendRequest(
  {
    url: 'http://localhost:3001/products',
    method: 'GET',
  },
  function (err, response) {
    var products = response.json();
    pm.environment.set('productId', products[0].id);
  },
);
```

---

## Common Issues & Solutions

### Issue: 401 Unauthorized

**Cause:** Cookie not included or expired
**Solution:** Login again to get fresh token

### Issue: 404 Product not found

**Cause:** Invalid product ID
**Solution:** Use `/products` endpoint to get valid IDs

### Issue: 400 Insufficient stock

**Cause:** Requested quantity exceeds available stock
**Solution:** Reduce quantity or check product stock

### Issue: 404 Cart item not found

**Cause:** Invalid cart item ID or item belongs to another user
**Solution:** Use GET /cart to see valid item IDs

---

## Quick Reference

| Endpoint        | Method | Body                    | Response         |
| --------------- | ------ | ----------------------- | ---------------- |
| `/cart`         | POST   | `{productId, quantity}` | Cart (201)       |
| `/cart`         | GET    | -                       | Cart (200)       |
| `/cart/count`   | GET    | -                       | `{count}` (200)  |
| `/cart/:itemId` | PATCH  | `{quantity}`            | Cart (200)       |
| `/cart/:itemId` | DELETE | -                       | Cart (200)       |
| `/cart`         | DELETE | -                       | Empty Cart (200) |

---

**Happy Testing! 🚀**
