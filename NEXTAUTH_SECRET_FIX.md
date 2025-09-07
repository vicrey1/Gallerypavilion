# NextAuth JWT Decryption Error Fix

## Problem
The application is experiencing `JWT_SESSION_ERROR` with "decryption operation failed" in production, indicating a NEXTAUTH_SECRET mismatch between local and Vercel environments.

## Root Cause
The NEXTAUTH_SECRET environment variable in Vercel doesn't match the local .env.production file, causing JWT tokens to fail decryption.

## Current Local Configuration
```
NEXTAUTH_SECRET="26f9190b3499f89797803257e86f4753cfc6ec6fc912992936695d38098d9089"
```

## Fix Steps

### 1. Check Vercel Environment Variables
1. Go to your Vercel dashboard
2. Navigate to your project settings
3. Go to Environment Variables section
4. Verify that `NEXTAUTH_SECRET` exists and matches the local value

### 2. Update Vercel Environment Variables
If the NEXTAUTH_SECRET is missing or different:
1. Add/Update `NEXTAUTH_SECRET` with the exact value: `26f9190b3499f89797803257e86f4753cfc6ec6fc912992936695d38098d9089`
2. Set it for Production environment
3. Redeploy the application

### 3. Alternative: Generate New Secret
If you prefer to generate a new secret:
```bash
openssl rand -base64 32
```
Then update both local .env.production and Vercel environment variables with the same value.

### 4. Verify Other Critical Environment Variables
Ensure these are also set in Vercel:
- `NEXTAUTH_URL="https://gallerypavilion.com"`
- `NEXTAUTH_URL_INTERNAL="https://gallerypavilion.com"`
- `DATABASE_URL` (your production database)
- `ADMIN_EMAIL` and `ADMIN_PASSWORD`

### 5. Force Redeploy
After updating environment variables:
1. Trigger a new deployment
2. Clear browser cookies/cache
3. Test photographer login again

## Verification
1. Check Vercel deployment logs for JWT errors
2. Test photographer login on production
3. Verify session persistence after login

## Important Notes
- NEXTAUTH_SECRET must be identical across all environments
- Changes to environment variables require redeployment
- JWT tokens encrypted with one secret cannot be decrypted with another
- Clear browser storage after fixing to remove invalid tokens