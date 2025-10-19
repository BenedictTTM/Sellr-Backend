# Postman API Testing Guide

Complete guide to test all API endpoints using Postman.

## 🚀 Base URL

```
http://localhost:3000
```

---

## 📋 Table of Contents

1. [Authentication Endpoints](#authentication-endpoints)
2. [User Profile Endpoints](#user-profile-endpoints)
3. [Environment Setup](#environment-setup)
4. [Postman Collection JSON](#postman-collection-json)

---

## 🔐 Authentication Endpoints

### 1. **Sign Up**

Creates a new user account with cookies.

**Endpoint:** `POST /auth/signup`

**Headers:**

```
Content-Type: application/json
```

**Body (JSON):**

```json
{
  "email": "john.doe@example.com",
  "password": "SecurePass123!",
  "username": "johndoe",
  "phone": "+1234567890"
}
```

**Expected Response (201):**

```json
{
  "success": true,
  "message": "User created successfully",
  "user": {
    "id": 1,
    "email": "john.doe@example.com",
    "username": "johndoe",
    "role": "USER",
    "premiumTier": "FREE"
  }
}
```

**Cookies Set:**

- `access_token` - JWT access token
- `refresh_token` - JWT refresh token

---

### 2. **Login**

Authenticates user and sets authentication cookies.

**Endpoint:** `POST /auth/login`

**Headers:**

```
Content-Type: application/json
```

**Body (JSON):**

```json
{
  "email": "john.doe@example.com",
  "password": "SecurePass123!"
}
```

**Expected Response (200):**

```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": 1,
    "email": "john.doe@example.com",
    "username": "johndoe",
    "role": "USER"
  }
}
```

---

### 3. **Verify Token**

Validates the current access token.

**Endpoint:** `GET /auth/verify`

**Headers:**

```
Cookie: access_token=<your_access_token>
```

**Expected Response (200):**

```json
{
  "success": true,
  "message": "Token is valid",
  "user": {
    "id": 1,
    "email": "john.doe@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "USER",
    "premiumTier": "FREE",
    "availableSlots": 5,
    "usedSlots": 0
  }
}
```

---

### 4. **Get Current User**

Retrieves authenticated user's profile.

**Endpoint:** `GET /auth/me`

**Headers:**

```
Cookie: access_token=<your_access_token>
```

**Expected Response (200):**

```json
{
  "success": true,
  "user": {
    "id": 1,
    "email": "john.doe@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "USER",
    "premiumTier": "FREE",
    "availableSlots": 5,
    "usedSlots": 0,
    "createdAt": "2025-10-19T12:00:00.000Z"
  }
}
```

---

### 5. **Refresh Token**

Generates new access token using refresh token.

**Endpoint:** `POST /auth/refresh`

**Headers:**

```
Cookie: refresh_token=<your_refresh_token>
```

**Expected Response (200):**

```json
{
  "success": true,
  "message": "Tokens refreshed successfully"
}
```

---

### 6. **Logout**

Logs out user and clears authentication cookies.

**Endpoint:** `POST /auth/logout`

**Headers:**

```
Cookie: access_token=<your_access_token>
```

**Expected Response (200):**

```json
{
  "success": true,
  "message": "Logout successful"
}
```

---

## 👤 User Profile Endpoints

### 1. **Get All Users**

Retrieves all users (admin endpoint).

**Endpoint:** `GET /users`

**Headers:**

```
Cookie: access_token=<your_access_token>
```

**Expected Response (200):**

```json
[
  {
    "id": 1,
    "email": "john.doe@example.com",
    "username": "johndoe",
    "firstName": "John",
    "lastName": "Doe",
    "storeName": "John's Store",
    "role": "USER",
    "premiumTier": "FREE"
  }
]
```

---

### 2. **Get User By ID**

Retrieves a specific user by ID.

**Endpoint:** `GET /users/:id`

**Example:** `GET /users/1`

**Headers:**

```
Cookie: access_token=<your_access_token>
```

**Expected Response (200):**

```json
{
  "id": 1,
  "email": "john.doe@example.com",
  "username": "johndoe",
  "firstName": "John",
  "lastName": "Doe",
  "storeName": "John's Store",
  "profilePic": "https://cloudinary.com/profile.jpg",
  "phone": "+1234567890",
  "role": "USER",
  "premiumTier": "FREE",
  "rating": 4.5,
  "totalRatings": 10
}
```

---

### 3. **Get User Profile**

Retrieves detailed user profile information.

**Endpoint:** `GET /users/:id/profile`

**Example:** `GET /users/1/profile`

**Headers:**

```
Cookie: access_token=<your_access_token>
```

**Expected Response (200):**

```json
{
  "id": 1,
  "email": "john.doe@example.com",
  "username": "johndoe",
  "firstName": "John",
  "lastName": "Doe",
  "storeName": "John's Store",
  "profilePic": "https://cloudinary.com/profile.jpg",
  "phone": "+1234567890",
  "premiumTier": "FREE",
  "availableSlots": 5,
  "usedSlots": 2,
  "rating": 4.5,
  "totalRatings": 10
}
```

---

### 4. **Update User**

Updates general user information.

**Endpoint:** `PATCH /users/:id`

**Example:** `PATCH /users/1`

**Headers:**

```
Content-Type: application/json
Cookie: access_token=<your_access_token>
```

**Body (JSON):**

```json
{
  "phone": "+0987654321",
  "username": "johndoe_updated"
}
```

**Expected Response (200):**

```json
{
  "id": 1,
  "email": "john.doe@example.com",
  "username": "johndoe_updated",
  "phone": "+0987654321",
  "firstName": "John",
  "lastName": "Doe"
}
```

---

### 5. **Update Profile**

Updates user profile (firstName, lastName, storeName).

**Endpoint:** `PATCH /users/:id/profile`

**Example:** `PATCH /users/1/profile`

**Headers:**

```
Content-Type: application/json
Cookie: access_token=<your_access_token>
```

**Body (JSON):**

```json
{
  "firstName": "Jonathan",
  "lastName": "Doe",
  "storeName": "Jonathan's Premium Store"
}
```

**Expected Response (200):**

```json
{
  "success": true,
  "message": "Profile updated successfully",
  "user": {
    "id": 1,
    "email": "john.doe@example.com",
    "username": "johndoe",
    "firstName": "Jonathan",
    "lastName": "Doe",
    "storeName": "Jonathan's Premium Store",
    "profilePic": "https://cloudinary.com/profile.jpg"
  }
}
```

**Validation Rules:**

- `firstName`: Min 2, Max 50 characters
- `lastName`: Min 2, Max 50 characters
- `storeName`: Min 2, Max 100 characters

---

### 6. **Update Profile Picture (URL)**

Updates profile picture using a direct URL.

**Endpoint:** `PATCH /users/:id/profile-picture`

**Example:** `PATCH /users/1/profile-picture`

**Headers:**

```
Content-Type: application/json
Cookie: access_token=<your_access_token>
```

**Body (JSON):**

```json
{
  "imageUrl": "https://cloudinary.com/new-profile-pic.jpg"
}
```

**Expected Response (200):**

```json
{
  "success": true,
  "message": "Profile picture updated successfully",
  "user": {
    "id": 1,
    "profilePic": "https://cloudinary.com/new-profile-pic.jpg"
  }
}
```

---

### 7. **Upload Profile Picture (File Upload)**

Uploads a profile picture file directly to Cloudinary.

**Endpoint:** `POST /users/:id/upload-profile-picture`

**Example:** `POST /users/1/upload-profile-picture`

**Headers:**

```
Cookie: access_token=<your_access_token>
Content-Type: multipart/form-data
```

**Body (form-data):**

```
Key: file
Type: File
Value: [Select image file from your computer]
```

**In Postman:**

1. Select **Body** tab
2. Choose **form-data**
3. Enter key: `file`
4. Change type to **File** (dropdown on right)
5. Click **Select Files** and choose an image

**Accepted Formats:** JPEG, PNG, JPG, WebP  
**Max Size:** 5MB

**Expected Response (201):**

```json
{
  "message": "Profile picture uploaded successfully",
  "user": {
    "id": 1,
    "email": "john.doe@example.com",
    "profilePic": "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/profile_pics/abc123.jpg"
  },
  "imageUrl": "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/profile_pics/abc123.jpg"
}
```

**Error Responses:**

```json
// No file uploaded
{
  "statusCode": 400,
  "message": "No file uploaded"
}

// Invalid file type
{
  "statusCode": 400,
  "message": "Only JPEG, PNG, and WebP images are allowed"
}

// File too large
{
  "statusCode": 400,
  "message": "File size must be less than 5MB"
}
```

---

## ⚙️ Environment Setup

### Create Postman Environment

1. Click **Environments** in Postman
2. Click **Create Environment**
3. Name it: `Sellr API - Local`
4. Add these variables:

| Variable        | Initial Value           | Current Value           |
| --------------- | ----------------------- | ----------------------- |
| `base_url`      | `http://localhost:3000` | `http://localhost:3000` |
| `access_token`  | (leave empty)           | (auto-filled)           |
| `refresh_token` | (leave empty)           | (auto-filled)           |
| `user_id`       | (leave empty)           | (auto-filled)           |

### Auto-Save Tokens Script

Add this to the **Tests** tab of your Login and Signup requests:

```javascript
// Parse response
const response = pm.response.json();

// Save user ID
if (response.user && response.user.id) {
  pm.environment.set('user_id', response.user.id);
}

// Extract cookies
const accessToken = pm.cookies.get('access_token');
const refreshToken = pm.cookies.get('refresh_token');

// Save to environment
if (accessToken) {
  pm.environment.set('access_token', accessToken);
}
if (refreshToken) {
  pm.environment.set('refresh_token', refreshToken);
}

console.log('User ID:', response.user.id);
console.log('Access Token:', accessToken ? 'Saved' : 'Not found');
console.log('Refresh Token:', refreshToken ? 'Saved' : 'Not found');
```

---

## 📦 Postman Collection JSON

Import this collection into Postman (File > Import):

```json
{
  "info": {
    "name": "Sellr API - User Management",
    "description": "Complete API collection for Sellr user authentication and profile management",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Authentication",
      "item": [
        {
          "name": "Sign Up",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "const response = pm.response.json();",
                  "if (response.user && response.user.id) {",
                  "    pm.environment.set('user_id', response.user.id);",
                  "}",
                  "const accessToken = pm.cookies.get('access_token');",
                  "const refreshToken = pm.cookies.get('refresh_token');",
                  "if (accessToken) pm.environment.set('access_token', accessToken);",
                  "if (refreshToken) pm.environment.set('refresh_token', refreshToken);"
                ],
                "type": "text/javascript"
              }
            }
          ],
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
              "raw": "{\n  \"email\": \"john.doe@example.com\",\n  \"password\": \"SecurePass123!\",\n  \"username\": \"johndoe\",\n  \"phone\": \"+1234567890\"\n}"
            },
            "url": {
              "raw": "{{base_url}}/auth/signup",
              "host": ["{{base_url}}"],
              "path": ["auth", "signup"]
            }
          }
        },
        {
          "name": "Login",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "const response = pm.response.json();",
                  "if (response.user && response.user.id) {",
                  "    pm.environment.set('user_id', response.user.id);",
                  "}",
                  "const accessToken = pm.cookies.get('access_token');",
                  "const refreshToken = pm.cookies.get('refresh_token');",
                  "if (accessToken) pm.environment.set('access_token', accessToken);",
                  "if (refreshToken) pm.environment.set('refresh_token', refreshToken);"
                ],
                "type": "text/javascript"
              }
            }
          ],
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
              "raw": "{\n  \"email\": \"john.doe@example.com\",\n  \"password\": \"SecurePass123!\"\n}"
            },
            "url": {
              "raw": "{{base_url}}/auth/login",
              "host": ["{{base_url}}"],
              "path": ["auth", "login"]
            }
          }
        },
        {
          "name": "Verify Token",
          "request": {
            "method": "GET",
            "header": [],
            "url": {
              "raw": "{{base_url}}/auth/verify",
              "host": ["{{base_url}}"],
              "path": ["auth", "verify"]
            }
          }
        },
        {
          "name": "Get Current User",
          "request": {
            "method": "GET",
            "header": [],
            "url": {
              "raw": "{{base_url}}/auth/me",
              "host": ["{{base_url}}"],
              "path": ["auth", "me"]
            }
          }
        },
        {
          "name": "Refresh Token",
          "request": {
            "method": "POST",
            "header": [],
            "url": {
              "raw": "{{base_url}}/auth/refresh",
              "host": ["{{base_url}}"],
              "path": ["auth", "refresh"]
            }
          }
        },
        {
          "name": "Logout",
          "request": {
            "method": "POST",
            "header": [],
            "url": {
              "raw": "{{base_url}}/auth/logout",
              "host": ["{{base_url}}"],
              "path": ["auth", "logout"]
            }
          }
        }
      ]
    },
    {
      "name": "User Profile",
      "item": [
        {
          "name": "Get All Users",
          "request": {
            "method": "GET",
            "header": [],
            "url": {
              "raw": "{{base_url}}/users",
              "host": ["{{base_url}}"],
              "path": ["users"]
            }
          }
        },
        {
          "name": "Get User By ID",
          "request": {
            "method": "GET",
            "header": [],
            "url": {
              "raw": "{{base_url}}/users/{{user_id}}",
              "host": ["{{base_url}}"],
              "path": ["users", "{{user_id}}"]
            }
          }
        },
        {
          "name": "Get User Profile",
          "request": {
            "method": "GET",
            "header": [],
            "url": {
              "raw": "{{base_url}}/users/{{user_id}}/profile",
              "host": ["{{base_url}}"],
              "path": ["users", "{{user_id}}", "profile"]
            }
          }
        },
        {
          "name": "Update User",
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
              "raw": "{\n  \"phone\": \"+0987654321\",\n  \"username\": \"johndoe_updated\"\n}"
            },
            "url": {
              "raw": "{{base_url}}/users/{{user_id}}",
              "host": ["{{base_url}}"],
              "path": ["users", "{{user_id}}"]
            }
          }
        },
        {
          "name": "Update Profile",
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
              "raw": "{\n  \"firstName\": \"Jonathan\",\n  \"lastName\": \"Doe\",\n  \"storeName\": \"Jonathan's Premium Store\"\n}"
            },
            "url": {
              "raw": "{{base_url}}/users/{{user_id}}/profile",
              "host": ["{{base_url}}"],
              "path": ["users", "{{user_id}}", "profile"]
            }
          }
        },
        {
          "name": "Update Profile Picture (URL)",
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
              "raw": "{\n  \"imageUrl\": \"https://cloudinary.com/new-profile-pic.jpg\"\n}"
            },
            "url": {
              "raw": "{{base_url}}/users/{{user_id}}/profile-picture",
              "host": ["{{base_url}}"],
              "path": ["users", "{{user_id}}", "profile-picture"]
            }
          }
        },
        {
          "name": "Upload Profile Picture (File)",
          "request": {
            "method": "POST",
            "header": [],
            "body": {
              "mode": "formdata",
              "formdata": [
                {
                  "key": "file",
                  "type": "file",
                  "src": [],
                  "description": "Upload an image file (JPEG, PNG, WebP, max 5MB)"
                }
              ]
            },
            "url": {
              "raw": "{{base_url}}/users/{{user_id}}/upload-profile-picture",
              "host": ["{{base_url}}"],
              "path": ["users", "{{user_id}}", "upload-profile-picture"]
            }
          }
        }
      ]
    }
  ],
  "variable": [
    {
      "key": "base_url",
      "value": "http://localhost:3000"
    }
  ]
}
```

---

## 🧪 Testing Workflow

### Quick Test Sequence:

1. **Sign Up** → Creates account and saves tokens
2. **Verify Token** → Confirms authentication works
3. **Get Current User** → Retrieves your profile
4. **Update Profile** → Updates name and store name
5. **Upload Profile Picture** → Upload an image file
6. **Get User Profile** → Verify all updates
7. **Logout** → Clears session

### Cookie Management in Postman:

Postman automatically handles cookies, but ensure:

1. Go to **Settings** > **General**
2. Enable **Automatically follow redirects**
3. Enable **Send cookies to nested domains**

---

## 📝 Notes

- Replace `{{user_id}}` with actual user ID or use environment variable
- Cookies are automatically included after login/signup
- The `storeName` field is now available in the database schema
- File uploads require `multipart/form-data` content type
- Maximum file size for profile pictures is 5MB
- Supported image formats: JPEG, PNG, JPG, WebP

---

## 🐛 Common Issues

### Issue: "Unauthorized" error

**Solution:** Make sure you're logged in and cookies are being sent

### Issue: File upload not working

**Solution:**

- Ensure you're using **form-data** not **raw JSON**
- Check file is under 5MB
- Verify file is an image (JPEG, PNG, WebP)

### Issue: "storeName does not exist" error

**Solution:** Run Prisma migration:

```bash
npx prisma migrate dev
npx prisma generate
```

---

**Happy Testing! 🚀**
