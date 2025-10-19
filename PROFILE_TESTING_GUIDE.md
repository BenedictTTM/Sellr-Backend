# Quick Start: User Profile Testing Guide

## 🚀 30-Second Test

### Prerequisites

```bash
# 1. Run migration
cd Backend
npx prisma migrate dev --name add_store_name_to_user

# 2. Start backend
npm run start:dev
```

---

## 📝 Test Scenarios

### Scenario 1: Update Profile Info (Name + Store Name)

**Postman/Thunder Client:**

```http
PATCH http://localhost:3000/users/1/profile
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "storeName": "John's Electronics Store"
}
```

**Expected Response:**

```json
{
  "id": 1,
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "storeName": "John's Electronics Store",
  "profilePic": null,
  "role": "USER",
  "updatedAt": "2025-10-19T..."
}
```

✅ **Success Indicators:**

- Status: 200 OK
- Fields updated correctly
- `updatedAt` timestamp changed

---

### Scenario 2: Upload Profile Picture

**Postman:**

1. Method: `POST`
2. URL: `http://localhost:3000/users/1/upload-profile-picture`
3. Body → form-data
4. Add field: `file` (type: File)
5. Choose image (JPEG/PNG)
6. Send

**Expected Response:**

```json
{
  "message": "Profile picture uploaded successfully",
  "user": {
    "id": 1,
    "profilePic": "https://res.cloudinary.com/.../abc123.jpg"
  },
  "imageUrl": "https://res.cloudinary.com/.../abc123.jpg"
}
```

✅ **Success Indicators:**

- Status: 200 OK
- `imageUrl` is Cloudinary URL
- Image accessible via URL
- Image is 400x400px (check in browser)

---

### Scenario 3: Get User Profile

**Request:**

```http
GET http://localhost:3000/users/1/profile
```

**Expected Response:**

```json
{
  "id": 1,
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "storeName": "John's Electronics Store",
  "profilePic": "https://res.cloudinary.com/.../profile.jpg",
  "role": "USER",
  "rating": 4.5,
  "totalRatings": 120
}
```

---

## 🐛 Common Issues & Solutions

### Issue 1: Migration Error

```bash
Error: Foreign key constraint failed
```

**Solution:**

```bash
npx prisma migrate reset
npx prisma migrate dev
npx prisma generate
```

---

### Issue 2: File Upload Not Working

```json
{
  "statusCode": 400,
  "message": "No file uploaded"
}
```

**Solution:**

- Ensure field name is exactly `file`
- Use `form-data`, not JSON
- Check Content-Type is `multipart/form-data`

---

### Issue 3: Cloudinary Error

```json
{
  "statusCode": 500,
  "message": "Upload failed"
}
```

**Solution:**

1. Check `.env` file:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

2. Verify credentials at cloudinary.com
3. Restart backend server

---

### Issue 4: File Too Large

```json
{
  "statusCode": 400,
  "message": "File size must be less than 5MB"
}
```

**Solution:**

- Compress image before upload
- Use online tools: TinyPNG, Squoosh
- Or reduce image resolution

---

### Issue 5: User Not Found

```json
{
  "statusCode": 404,
  "message": "User with ID 1 not found"
}
```

**Solution:**

- Check user exists: `GET http://localhost:3000/users/1`
- Create test user if needed
- Verify database connection

---

## 🎯 Quick Validation Checklist

- [ ] Migration completed successfully
- [ ] Backend server running
- [ ] Cloudinary credentials configured
- [ ] Can update firstName/lastName
- [ ] Can update storeName
- [ ] Can upload profile picture (JPEG)
- [ ] Can upload profile picture (PNG)
- [ ] Profile picture shows in GET request
- [ ] Image is 400x400px
- [ ] File size validation works (try 6MB file)
- [ ] File type validation works (try PDF)

---

## 🔍 Debugging Commands

### Check Database Schema

```bash
npx prisma studio
# Open http://localhost:5555
# Navigate to User model
# Verify storeName column exists
```

### Check User Data

```sql
-- In Prisma Studio or pgAdmin
SELECT id, email, firstName, lastName, storeName, profilePic
FROM "User"
WHERE id = 1;
```

### Test Cloudinary Connection

```bash
# In Backend folder
node -e "
const cloudinary = require('cloudinary').v2;
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});
cloudinary.api.ping().then(console.log).catch(console.error);
"
```

---

## 📊 Expected File Sizes

| Resolution | Format     | Expected Size |
| ---------- | ---------- | ------------- |
| 400x400    | JPEG (80%) | 20-50 KB      |
| 400x400    | PNG        | 100-200 KB    |
| 400x400    | WebP       | 15-30 KB      |

Cloudinary automatically optimizes!

---

## 🎨 Frontend Integration Test

After backend works, test with simple HTML:

```html
<!DOCTYPE html>
<html>
  <body>
    <h2>Upload Profile Picture</h2>
    <form id="uploadForm">
      <input type="file" name="file" accept="image/*" required />
      <button type="submit">Upload</button>
    </form>

    <div id="result"></div>

    <script>
      document
        .getElementById('uploadForm')
        .addEventListener('submit', async (e) => {
          e.preventDefault();
          const formData = new FormData(e.target);

          const response = await fetch(
            'http://localhost:3000/users/1/upload-profile-picture',
            {
              method: 'POST',
              body: formData,
            },
          );

          const result = await response.json();
          document.getElementById('result').innerHTML =
            `<img src="${result.imageUrl}" width="400" />`;
        });
    </script>
  </body>
</html>
```

Save as `test.html` and open in browser!

---

## ✅ Success Criteria

**You know it works when:**

1. ✅ Migration adds `storeName` column
2. ✅ Profile update returns 200 with updated data
3. ✅ Image upload returns Cloudinary URL
4. ✅ Image is accessible and 400x400px
5. ✅ GET request shows updated profile with image
6. ✅ Validation rejects large/invalid files
7. ✅ Frontend can display uploaded image

---

## 🆘 Still Not Working?

1. **Check Console Logs**: Look for 🚀, ✅, ❌ emojis in backend logs
2. **Check Network Tab**: Inspect request/response in browser DevTools
3. **Verify Environment**: `console.log(process.env.CLOUDINARY_CLOUD_NAME)`
4. **Test Simple Endpoint**: Try `GET /users` to verify backend is running
5. **Check CORS**: Ensure frontend can access backend (add CORS if needed)

---

Good luck! 🚀
