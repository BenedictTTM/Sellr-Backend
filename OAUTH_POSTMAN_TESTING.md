# 🧪 OAuth Postman Testing Guide

Complete guide for testing Google OAuth authentication using Postman.

---

## 📋 Quick Start

### 1. Import Postman Collection

1. Open Postman
2. Click **Import** button
3. Select `postman-oauth-tests.json`
4. Collection "Sellr - Google OAuth Testing" will be added

### 2. Set Environment Variables

In the collection variables:

- `BASE_URL`: `http://localhost:3001` (for local testing)
- `PRODUCTION_URL`: `https://sellr-backend-1.onrender.com` (for production)

---

## 🎯 Testing Scenarios

### Scenario 1: Test OAuth Flow (Recommended)

**Endpoint:** `POST /auth/oauth/test`

This simulates the entire OAuth flow without requiring Google authentication.

**Request:**

```json
POST http://localhost:3001/auth/oauth/test
Content-Type: application/json

{
  "email": "testuser@gmail.com",
  "firstName": "Test",
  "lastName": "User",
  "profilePic": "https://via.placeholder.com/150"
}
```

**Response:**

```json
{
  "success": true,
  "message": "OAuth authentication successful (TEST MODE)",
  "user": {
    "id": 1,
    "email": "testuser@gmail.com",
    "username": "testuser",
    "firstName": "Test",
    "lastName": "User",
    "profilePic": "https://via.placeholder.com/150",
    "role": "USER",
    "premiumTier": "FREE",
    "availableSlots": 5,
    "usedSlots": 0
  },
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "remainingSlots": 5,
  "cookies": {
    "access_token": "Set in HTTP-only cookie (maxAge: 3500000ms)",
    "refresh_token": "Set in HTTP-only cookie (maxAge: 604800000ms)"
  }
}
```

**What happens:**

1. ✅ User is created if new, or found if exists
2. ✅ JWT tokens are generated
3. ✅ Cookies are set (check Postman's Cookies tab)
4. ✅ User data is returned
5. ✅ Tokens are returned (for manual testing)

---

### Scenario 2: Test Protected Routes

After getting tokens from Scenario 1:

**Method 1: Using Cookies (Automatic)**

Postman automatically captures cookies from the test endpoint. Simply send requests to protected routes:

```
GET http://localhost:3001/users/me
```

**Method 2: Using Authorization Header (Manual)**

1. Copy `access_token` from the test response
2. Add to request headers:

```
GET http://localhost:3001/users/me
Cookie: access_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

### Scenario 3: Test User Creation

**First Request (New User):**

```json
POST /auth/oauth/test
{
  "email": "newuser@gmail.com",
  "firstName": "New",
  "lastName": "User"
}
```

**Check Response:**

- User object should have a new `id`
- `availableSlots` should be `5` (default for FREE tier)
- `usedSlots` should be `0`

**Second Request (Existing User):**

```json
POST /auth/oauth/test
{
  "email": "newuser@gmail.com",
  "firstName": "Updated",
  "lastName": "Name"
}
```

**Check Response:**

- Same `id` as before (user found, not created)
- `firstName` and `lastName` updated
- Slots remain the same

---

### Scenario 4: Test Profile Sync

OAuth should update user profile from Google:

```json
POST /auth/oauth/test
{
  "email": "existing@gmail.com",
  "firstName": "Updated First",
  "lastName": "Updated Last",
  "profilePic": "https://newphoto.com/pic.jpg"
}
```

**Verify:**

- User's name is updated
- Profile picture is updated
- Other data (slots, role) remains unchanged

---

## 🔍 Debugging Tips

### Check Cookies in Postman

1. Send the test OAuth request
2. Go to **Cookies** (under Send button)
3. Look for domain `localhost` or `sellr-backend-1.onrender.com`
4. You should see:
   - `access_token`
   - `refresh_token`

### View Cookie Details

Click on a cookie to see:

```
Name: access_token
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Domain: localhost
Path: /
Expires: <timestamp>
HttpOnly: true
Secure: true
SameSite: None
```

### Common Issues

**Issue: "No access token found"**

- **Cause:** Cookies not being sent
- **Fix:** Check Postman's cookie settings, enable "Automatically follow redirects"

**Issue: "401 Unauthorized"**

- **Cause:** Token expired or invalid
- **Fix:** Generate new tokens using test endpoint

**Issue: "User already exists"**

- **This is normal!** OAuth finds existing users by email
- **Fix:** Use a different email to create a new user

---

## 📊 Response Status Codes

| Code | Meaning      | Action                                       |
| ---- | ------------ | -------------------------------------------- |
| 200  | Success      | OAuth login worked                           |
| 201  | Created      | New user created                             |
| 401  | Unauthorized | Invalid/missing token                        |
| 409  | Conflict     | Email already exists with different provider |
| 500  | Server Error | Check backend logs                           |

---

## 🚀 Testing in Production

### Switch to Production URL

Change collection variable:

```
BASE_URL = https://sellr-backend-1.onrender.com
```

### Test Production OAuth

```json
POST https://sellr-backend-1.onrender.com/auth/oauth/test
Content-Type: application/json

{
  "email": "production-test@gmail.com",
  "firstName": "Prod",
  "lastName": "Test"
}
```

### Verify Production Cookies

Check that cookies have:

- `Secure: true`
- `SameSite: None`
- Domain: `sellr-backend-1.onrender.com`

---

## 🔐 Security Notes

### ⚠️ IMPORTANT: Disable Test Endpoint in Production

The `/auth/oauth/test` endpoint should be **disabled in production** or protected with an API key.

**Option 1: Environment Check**

```typescript
@Post('test')
async testOAuthLogin(...) {
  if (process.env.NODE_ENV === 'production') {
    throw new ForbiddenException('Test endpoint disabled in production');
  }
  // ... rest of code
}
```

**Option 2: API Key Protection**

```typescript
@Post('test')
@UseGuards(ApiKeyGuard)
async testOAuthLogin(...) {
  // ... code
}
```

**Option 3: Remove from Production Build**
Comment out the test endpoint before deploying to production.

---

## 📝 Sample Test Cases

### Test Case 1: New User Registration

- **Input:** New email
- **Expected:** User created, tokens generated, slots = 5
- **Verify:** Database has new user record

### Test Case 2: Existing User Login

- **Input:** Existing email
- **Expected:** User found, tokens generated, data updated
- **Verify:** User count doesn't increase

### Test Case 3: Profile Update

- **Input:** Existing email with different name
- **Expected:** Name updated, same user ID
- **Verify:** Profile changes saved to database

### Test Case 4: Token Generation

- **Input:** Any valid email
- **Expected:** Valid JWT tokens in response and cookies
- **Verify:** Tokens can decode with jwt.io

### Test Case 5: Cookie Configuration

- **Input:** Test OAuth request
- **Expected:** Cookies with correct security flags
- **Verify:** HttpOnly=true, Secure=true, SameSite=none

---

## 🛠️ Advanced Testing

### Test Username Collision

```json
// First request
POST /auth/oauth/test
{ "email": "user1@gmail.com" }
// Username: "user1"

// Second request with same base username
POST /auth/oauth/test
{ "email": "user1@yahoo.com" }
// Username: "user1" + random number
```

### Test Invalid Data

```json
POST /auth/oauth/test
{
  "email": ""  // Invalid: empty email
}
// Expected: Error response
```

```json
POST /auth/oauth/test
{
  "firstName": "Test"  // Missing email
}
// Expected: Error response
```

---

## 📞 Support

If you encounter issues:

1. **Check Backend Logs** - Look for `[OAUTH-TEST]` prefixed logs
2. **Verify Environment Variables** - Ensure `.env` has correct values
3. **Test Backend Health** - `GET /` should return 200
4. **Check Database Connection** - Ensure Prisma can connect

---

## ✅ Checklist

Before deploying:

- [ ] Test endpoint works locally
- [ ] Cookies are being set correctly
- [ ] Protected routes work with cookies
- [ ] New users are created successfully
- [ ] Existing users are updated successfully
- [ ] Username collision handling works
- [ ] Tokens are valid JWTs
- [ ] Test endpoint is disabled/protected in production

---

Happy Testing! 🎉
