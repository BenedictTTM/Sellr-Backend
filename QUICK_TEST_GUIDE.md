# Quick Start: Testing New Auth Endpoints

## 🚀 Quick Test Guide

### Step 1: Start the Backend

```bash
cd Backend
npm run start:dev
```

### Step 2: Login to Get Token

**Using Thunder Client / Postman**:

```http
POST http://localhost:3001/auth/login
Content-Type: application/json

{
  "email": "your-email@example.com",
  "password": "your-password"
}
```

**Response**:

- Check the **Cookies** tab - you should see `access_token` and `refresh_token`
- Copy the `access_token` value for testing

### Step 3: Test /auth/verify

**Thunder Client / Postman**:

```http
GET http://localhost:3001/auth/verify
Cookie: access_token=YOUR_TOKEN_HERE
```

**Expected Response** (200 OK):

```json
{
  "success": true,
  "message": "Token is valid",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "USER",
    "premiumTier": "FREE",
    "availableSlots": 10,
    "usedSlots": 3
  }
}
```

### Step 4: Test /auth/me

**Thunder Client / Postman**:

```http
GET http://localhost:3001/auth/me
Cookie: access_token=YOUR_TOKEN_HERE
```

**Expected Response** (200 OK):

```json
{
  "success": true,
  "user": {
    "id": 1,
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "USER",
    "premiumTier": "FREE",
    "availableSlots": 10,
    "usedSlots": 3,
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

## 🧪 Test with cURL (Terminal)

### Login

```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }' \
  -c cookies.txt \
  -v
```

### Verify Token

```bash
curl -X GET http://localhost:3001/auth/verify \
  -b cookies.txt \
  -v
```

### Get Current User

```bash
curl -X GET http://localhost:3001/auth/me \
  -b cookies.txt \
  -v
```

---

## 🌐 Test with Frontend

### Start Both Servers

```bash
# Terminal 1: Backend
cd Backend
npm run start:dev

# Terminal 2: Frontend
cd frontend
npm run dev
```

### Test in Browser Console

1. **Open browser**: http://localhost:3000
2. **Login** through the UI
3. **Open DevTools Console** and run:

```javascript
// Test session validation
fetch('/api/auth/session', {
  credentials: 'include',
  cache: 'no-store',
})
  .then((r) => r.json())
  .then((data) => console.log('Session:', data));

// Test get user
fetch('/api/auth/me', {
  credentials: 'include',
})
  .then((r) => r.json())
  .then((data) => console.log('User:', data));
```

**Expected Console Output**:

```javascript
Session: { authenticated: true, message: "User is authenticated" }
User: { success: true, user: { id: 1, email: "...", ... } }
```

---

## ✅ Success Indicators

| Test             | Success Criteria                          |
| ---------------- | ----------------------------------------- |
| `/auth/verify`   | ✅ Returns 200 with user data             |
| `/auth/me`       | ✅ Returns 200 with user data + createdAt |
| No token         | ✅ Returns 401 "Access token is required" |
| Invalid token    | ✅ Returns 401 "Invalid or expired token" |
| Frontend session | ✅ Returns `authenticated: true`          |
| Frontend getUser | ✅ Returns user object (not null)         |

---

## 🐛 Troubleshooting

### Issue: "Access token is required"

**Solution**: Make sure you're sending the cookie

- Thunder Client: Use the **Cookies** tab
- cURL: Use `-b cookies.txt` flag
- Frontend: Use `credentials: 'include'`

### Issue: "Invalid or expired token"

**Solutions**:

1. Token expired (15 min default) - login again
2. Wrong JWT_SECRET - check `.env` file
3. Token format invalid - get fresh token

### Issue: Backend not starting

**Solutions**:

1. Check PostgreSQL is running
2. Check `.env` file exists
3. Run `npm install`
4. Check port 3001 is not in use

### Issue: Frontend not connecting to backend

**Solutions**:

1. Check `NEXT_PUBLIC_BACKEND_URL` in frontend `.env`
2. Ensure it's set to `http://localhost:3001`
3. Check CORS settings in backend

---

## 📋 Checklist

After implementation, verify:

- [ ] Backend starts without errors
- [ ] Can login successfully
- [ ] Cookies are set (check DevTools)
- [ ] GET `/auth/verify` returns 200 with user data
- [ ] GET `/auth/me` returns 200 with user data
- [ ] Invalid token returns 401
- [ ] No token returns 401
- [ ] Frontend session validation works
- [ ] Frontend getUser() returns user object
- [ ] Protected routes redirect to login when not authenticated

---

**Need Help?**

- Check logs in terminal
- Check browser DevTools Console
- Check Network tab for request/response
- Verify cookies are being sent

**All tests passing?** 🎉 Your authentication system is fully functional!
