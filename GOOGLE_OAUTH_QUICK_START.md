# Quick Test Guide - Google OAuth

## ✅ Implementation Status: COMPLETE

All files have been created and are error-free!

## 🚀 Quick Start (5 Minutes)

### Step 1: Set Up Google OAuth Credentials

1. Go to https://console.cloud.google.com/
2. Create/select a project
3. Enable Google+ API
4. Configure OAuth consent screen
5. Create OAuth 2.0 Client ID
6. Copy Client ID and Secret

### Step 2: Update .env File

```bash
# Add these to Backend/.env
GOOGLE_CLIENT_ID="YOUR_CLIENT_ID.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="YOUR_CLIENT_SECRET"
GOOGLE_CALLBACK_URL="http://localhost:3001/auth/oauth/google/callback"

# Make sure these exist:
JWT_SECRET="your-secret"
JWT_REFRESH_SECRET="your-refresh-secret"
JWT_EXPIRES_IN="45m"
JWT_REFRESH_EXPIRES_IN="7d"
JWT_EXPIRES_IN_MS="2700000"
JWT_REFRESH_EXPIRES_IN_MS="604800000"
FRONTEND_URL="http://localhost:3000"
DATABASE_URL="your-postgres-url"
```

### Step 3: Start the Server

```powershell
cd Backend
npm run start:dev
```

Look for: `✅ Google OAuth Strategy initialized`

### Step 4: Test OAuth Flow

Open your browser to:

```
http://localhost:3001/auth/oauth/google
```

You should:

1. ✅ Redirect to Google login
2. ✅ Select/login to Google account
3. ✅ Authorize the app
4. ✅ Redirect back to `http://localhost:3000/dashboard?oauth=success`
5. ✅ Cookies set: `access_token` and `refresh_token`

## 🔍 Quick Verification

### Check Cookies (Browser DevTools)

```
Application → Cookies → http://localhost:3000
- access_token (HttpOnly)
- refresh_token (HttpOnly)
```

### Test Authenticated Request

```bash
# Windows PowerShell
$cookie = "access_token=YOUR_TOKEN_HERE"
Invoke-WebRequest -Uri "http://localhost:3001/auth/me" -Headers @{"Cookie"=$cookie}
```

### Check Database

```sql
SELECT id, email, username, "firstName", "lastName", "profilePic"
FROM "User"
WHERE email = 'your-google-email@gmail.com';
```

## 📁 Files Created

✅ `src/auth/strategies/google.strategy.ts` - OAuth strategy  
✅ `src/auth/services/oauth.service.ts` - Business logic  
✅ `src/auth/controllers/oauth.controller.ts` - HTTP endpoints  
✅ `src/auth/guards/google-oauth.guard.ts` - Route protection  
✅ `src/auth/dto/oauth-user.dto.ts` - Data validation  
✅ `auth.module.ts` - Updated with OAuth providers  
✅ `.env.example` - Updated with OAuth config

## 🎯 API Endpoints

| Method | Endpoint                      | Description                     |
| ------ | ----------------------------- | ------------------------------- |
| GET    | `/auth/oauth/google`          | Initiate OAuth flow             |
| GET    | `/auth/oauth/google/callback` | OAuth callback (auto)           |
| GET    | `/auth/me`                    | Get current user (with cookies) |
| POST   | `/auth/refresh`               | Refresh tokens                  |
| POST   | `/auth/logout`                | Logout                          |

## 🔧 Troubleshooting

### "Redirect URI mismatch"

- Check Google Console → Credentials → Authorized redirect URIs
- Must exactly match: `http://localhost:3001/auth/oauth/google/callback`

### "Strategy not found"

- Restart NestJS server
- Check logs for: `✅ Google OAuth Strategy initialized`

### "CORS error"

- Check `main.ts` CORS configuration
- Frontend URL must be in allowed origins

## 📖 Full Documentation

See `GOOGLE_OAUTH_SETUP.md` for complete documentation including:

- Architecture details
- Security features
- Production deployment
- Frontend integration examples
- Error handling strategies

## 🎨 Frontend Integration

### Quick Example (React/Next.js)

```tsx
// components/GoogleLoginButton.tsx
export function GoogleLoginButton() {
  const handleLogin = () => {
    window.location.href = 'http://localhost:3001/auth/oauth/google';
  };

  return <button onClick={handleLogin}>🔐 Login with Google</button>;
}
```

That's it! You're ready to go! 🚀
