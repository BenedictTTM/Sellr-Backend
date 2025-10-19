# User Profile Management API

## Overview

Professional implementation for managing user profile information including profile picture, name, and store name.

---

## Architecture Decisions

### 1. **Separation of Concerns**

- **Profile Updates**: Separate endpoint for profile-related fields (firstName, lastName, storeName, profilePic)
- **General Updates**: Keep user.dto for administrative updates
- **Security**: Prevents accidental exposure of sensitive fields

### 2. **Image Storage Strategy**

- **Cloudinary Integration**: Automatic optimization, CDN delivery
- **Image Transformation**: Auto-crop to 400x400, face detection, quality optimization
- **Folder Organization**: `profile_pictures/` for easy management

### 3. **Validation**

- File type validation (JPEG, PNG, WebP only)
- File size validation (5MB max)
- Field length validation (2-100 characters)

---

## Database Schema

```prisma
model User {
  id           Int       @id @default(autoincrement())
  email        String    @unique
  firstName    String?
  lastName     String?
  storeName    String?   // New field for sellers
  profilePic   String?   // Cloudinary URL
  // ... other fields
}
```

---

## API Endpoints

### 1. Get User Profile

```http
GET /users/:id/profile
```

**Response:**

```json
{
  "id": 1,
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "storeName": "John's Electronics",
  "profilePic": "https://res.cloudinary.com/.../profile.jpg",
  "role": "USER",
  "rating": 4.5,
  "totalRatings": 120
}
```

---

### 2. Update Profile (Text Fields)

```http
PATCH /users/:id/profile
Content-Type: application/json
```

**Request Body:**

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "storeName": "John's Premium Store"
}
```

**Response:**

```json
{
  "id": 1,
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "storeName": "John's Premium Store",
  "profilePic": "https://res.cloudinary.com/.../profile.jpg",
  "updatedAt": "2025-10-19T12:00:00Z"
}
```

**Validation Rules:**

- `firstName`: 2-50 characters
- `lastName`: 2-50 characters
- `storeName`: 2-100 characters
- All fields optional (update only what you send)

---

### 3. Upload Profile Picture (File Upload)

```http
POST /users/:id/upload-profile-picture
Content-Type: multipart/form-data
```

**Request Body (Form Data):**

- `file`: Image file (JPEG, PNG, WebP)

**Response:**

```json
{
  "message": "Profile picture uploaded successfully",
  "user": {
    "id": 1,
    "profilePic": "https://res.cloudinary.com/your-cloud/profile_pictures/abc123.jpg"
  },
  "imageUrl": "https://res.cloudinary.com/your-cloud/profile_pictures/abc123.jpg"
}
```

**Validation:**

- Allowed formats: JPEG, PNG, WebP
- Max file size: 5MB
- Auto-transformed to: 400x400px, optimized quality

---

### 4. Update Profile Picture (URL)

```http
PATCH /users/:id/profile-picture
Content-Type: application/json
```

**Request Body:**

```json
{
  "imageUrl": "https://res.cloudinary.com/.../profile.jpg"
}
```

---

## Frontend Integration Examples

### React/Next.js - Update Profile

```typescript
// lib/user.ts
interface UpdateProfileData {
  firstName?: string;
  lastName?: string;
  storeName?: string;
}

export async function updateProfile(
  userId: number,
  data: UpdateProfileData,
): Promise<any> {
  const response = await fetch(`/api/users/${userId}/profile`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Failed to update profile');
  }

  return response.json();
}
```

---

### React/Next.js - Upload Profile Picture

```typescript
// components/ProfilePictureUpload.tsx
'use client';

import { useState } from 'react';

export default function ProfilePictureUpload({ userId }: { userId: number }) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Show preview
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setUploading(true);

    const formData = new FormData(e.currentTarget);

    try {
      const response = await fetch(`/api/users/${userId}/upload-profile-picture`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Upload failed');
      }

      const result = await response.json();
      console.log('Upload successful:', result);
      alert('Profile picture updated!');
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload profile picture');
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleUpload} className="space-y-4">
      <div>
        {preview && (
          <img
            src={preview}
            alt="Preview"
            className="w-32 h-32 rounded-full object-cover mb-4"
          />
        )}
        <input
          type="file"
          name="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          required
          className="block w-full text-sm"
        />
      </div>
      <button
        type="submit"
        disabled={uploading}
        className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
      >
        {uploading ? 'Uploading...' : 'Upload Profile Picture'}
      </button>
    </form>
  );
}
```

---

### React/Next.js - Profile Form Component

```typescript
// components/ProfileForm.tsx
'use client';

import { useState } from 'react';
import { updateProfile } from '@/lib/user';

interface ProfileFormProps {
  userId: number;
  initialData: {
    firstName?: string;
    lastName?: string;
    storeName?: string;
  };
}

export default function ProfileForm({ userId, initialData }: ProfileFormProps) {
  const [formData, setFormData] = useState(initialData);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await updateProfile(userId, formData);
      console.log('Profile updated:', result);
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Update error:', error);
      alert('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      <div>
        <label className="block text-sm font-medium mb-1">First Name</label>
        <input
          type="text"
          value={formData.firstName || ''}
          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
          className="w-full px-3 py-2 border rounded"
          minLength={2}
          maxLength={50}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Last Name</label>
        <input
          type="text"
          value={formData.lastName || ''}
          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
          className="w-full px-3 py-2 border rounded"
          minLength={2}
          maxLength={50}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Store Name</label>
        <input
          type="text"
          value={formData.storeName || ''}
          onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
          className="w-full px-3 py-2 border rounded"
          placeholder="e.g., John's Electronics"
          minLength={2}
          maxLength={100}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
      >
        {loading ? 'Updating...' : 'Update Profile'}
      </button>
    </form>
  );
}
```

---

## Testing

### Using Postman

#### 1. Update Profile

```
PATCH http://localhost:3000/users/1/profile
Content-Type: application/json

Body:
{
  "firstName": "John",
  "lastName": "Doe",
  "storeName": "John's Store"
}
```

#### 2. Upload Profile Picture

```
POST http://localhost:3000/users/1/upload-profile-picture
Content-Type: multipart/form-data

Body (form-data):
file: [Select image file]
```

---

## Best Practices Implemented

### ✅ Security

- Separate profile endpoint prevents accidental sensitive data exposure
- File type validation prevents malicious uploads
- File size limits prevent DOS attacks

### ✅ Performance

- Cloudinary CDN for fast image delivery
- Automatic image optimization (WebP, quality)
- 400x400 standard size reduces bandwidth

### ✅ User Experience

- Face detection for smart cropping
- Preview before upload
- Clear error messages
- Loading states

### ✅ Scalability

- Cloudinary handles image storage/transformation
- No local file storage needed
- Automatic backup and redundancy

### ✅ Maintainability

- Separate DTOs for different operations
- Clear service methods
- Comprehensive documentation
- TypeScript type safety

---

## Error Handling

### Common Errors

| Status | Error             | Solution                         |
| ------ | ----------------- | -------------------------------- |
| 400    | No file uploaded  | Ensure 'file' field in form-data |
| 400    | Invalid file type | Use JPEG, PNG, or WebP only      |
| 400    | File too large    | Reduce file size below 5MB       |
| 404    | User not found    | Verify user ID exists            |
| 500    | Cloudinary error  | Check Cloudinary credentials     |

---

## Migration Steps

1. **Run database migration:**

```bash
cd Backend
npx prisma migrate dev --name add_store_name_to_user
```

2. **Generate Prisma client:**

```bash
npx prisma generate
```

3. **Restart backend server:**

```bash
npm run start:dev
```

4. **Test endpoints** with Postman or your frontend

---

## Roadmap / Future Enhancements

- [ ] Multiple profile pictures (gallery)
- [ ] Image cropping UI in frontend
- [ ] Profile picture history
- [ ] Social media profile links
- [ ] Store banner image
- [ ] Profile completeness percentage
- [ ] Avatar generation for users without photos

---

## Support

For issues or questions:

1. Check error logs in console
2. Verify Cloudinary configuration
3. Ensure database migration completed successfully
4. Check file permissions and CORS settings
