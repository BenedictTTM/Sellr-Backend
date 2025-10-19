# Quick Test: User Profile & Image Upload

Simple guide to test user profile updates and image uploads.

## 🚀 Base URL

```
http://localhost:3000
```

---

## 1️⃣ First: Login to Get Authentication

**Endpoint:** `POST /auth/login`

**Body (JSON):**

```json
{
  "email": "your-email@example.com",
  "password": "your-password"
}
```

**Response:** You'll get cookies automatically (no need to copy tokens manually)

---

## 2️⃣ Update User Profile (Name & Store Name)

**Endpoint:** `PATCH /users/{your-user-id}/profile`

**Example:** `PATCH /users/1/profile`

**Headers:**

```
Content-Type: application/json
```

**Body (JSON):**

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "storeName": "John's Amazing Store"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Profile updated successfully",
  "user": {
    "id": 1,
    "firstName": "John",
    "lastName": "Doe",
    "storeName": "John's Amazing Store"
  }
}
```

---

## 3️⃣ Upload Profile Picture (File Upload)

**Endpoint:** `POST /users/{your-user-id}/upload-profile-picture`

**Example:** `POST /users/1/upload-profile-picture`

### In Postman:

1. Select **POST** method
2. Enter URL: `http://localhost:3000/users/1/upload-profile-picture`
3. Go to **Body** tab
4. Select **form-data** (NOT raw or binary)
5. Add a new key:
   - **Key:** `file`
   - **Type:** Change from "Text" to **File** (click dropdown)
   - **Value:** Click "Select Files" and choose an image
6. Click **Send**

### Visual Guide:

```
┌─────────────────────────────────────┐
│ Body Tab                            │
├─────────────────────────────────────┤
│ ○ none                              │
│ ○ form-data         ← SELECT THIS  │
│ ○ x-www-form-urlencoded            │
│ ○ raw                              │
│ ○ binary                           │
│ ○ GraphQL                          │
└─────────────────────────────────────┘

┌──────────┬──────────┬─────────────────────┐
│ KEY      │ TYPE  ▼  │ VALUE               │
├──────────┼──────────┼─────────────────────┤
│ file     │ File  ▼  │ [Select Files...]   │
└──────────┴──────────┴─────────────────────┘
```

**Accepted Files:**

- JPEG (.jpg, .jpeg)
- PNG (.png)
- WebP (.webp)
- Max size: 5MB

**Response:**

```json
{
  "message": "Profile picture uploaded successfully",
  "user": {
    "id": 1,
    "email": "your-email@example.com",
    "profilePic": "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/profile_pics/abc123.jpg"
  },
  "imageUrl": "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/profile_pics/abc123.jpg"
}
```

---

## 4️⃣ Verify Updates: Get User Profile

**Endpoint:** `GET /users/{your-user-id}/profile`

**Example:** `GET /users/1/profile`

**Response:**

```json
{
  "id": 1,
  "email": "your-email@example.com",
  "username": "yourusername",
  "firstName": "John",
  "lastName": "Doe",
  "storeName": "John's Amazing Store",
  "profilePic": "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/profile_pics/abc123.jpg",
  "phone": "+1234567890",
  "premiumTier": "FREE",
  "rating": 0.0
}
```

---

## 🎯 Quick Test Sequence

1. **Login** → Get authenticated
2. **Update Profile** → Set your name and store name
3. **Upload Image** → Upload a profile picture
4. **Get Profile** → Verify everything updated correctly

---

## ⚠️ Common Issues

### "No file uploaded" error

- Make sure you selected **form-data** in Body
- Make sure the key is exactly `file`
- Make sure you changed type to **File** (not Text)

### "Only JPEG, PNG, and WebP images are allowed"

- Upload an image file (not PDF, Word doc, etc.)
- Accepted formats: .jpg, .jpeg, .png, .webp

### "File size must be less than 5MB"

- Your image is too large
- Resize or compress the image

### "Unauthorized" error

- You need to login first
- Postman should automatically handle cookies after login

---

## 💡 Pro Tip

After logging in, Postman automatically stores your authentication cookies. You don't need to manually copy/paste tokens. Just login once and all subsequent requests will be authenticated!

---

**Happy Testing! 🎉**
