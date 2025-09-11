# NextAuth Callback Error Fix Guide

## Problem

The production site is returning a 401 Unauthorized error for the photographer login callback:

```
POST https://www.gallerypavilion.com/api/auth/callback/photographer-login 401 (Unauthorized)
Error: Callback for provider type credentials not supported
```

## Root Cause Analysis

This error typically occurs due to one of these issues:

1. **Missing or incorrect NEXTAUTH_SECRET** in production environment
2. **Incorrect NEXTAUTH_URL** configuration
3. **Environment variable scope** - variables not set for Production environment
4. **JWT token encryption/decryption failure**
5. **CSRF token validation issues**

## Immediate Fix Steps

### Step 1: Verify Vercel Environment Variables

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Ensure these variables are set for **Production** environment:

```bash
# Required NextAuth Variables
NEXTAUTH_SECRET="your-32-character-secret-here"
NEXTAUTH_URL="https://www.gallerypavilion.com"

# Database (should already be set)
DATABASE_URL="your-production-database-url"

# Admin credentials
ADMIN_EMAIL="admin@gallerypavilion.com"
ADMIN_PASSWORD="your-admin-password"
```

### Step 2: Generate New NEXTAUTH_SECRET

If NEXTAUTH_SECRET is missing or incorrect:

```bash
# Generate a new secret (run locally)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Example output: `26f9190b3499f89797803257e86f4753cfc6ec6fc912992936695d38098d9089`

### Step 3: Verify NEXTAUTH_URL

Ensure NEXTAUTH_URL exactly matches your production domain:

```bash
# Correct format
NEXTAUTH_URL="https://www.gallerypavilion.com"

# NOT these formats:
# NEXTAUTH_URL="https://www.gallerypavilion.com/"  # No trailing slash
# NEXTAUTH_URL="http://www.gallerypavilion.com"   # Must be HTTPS
# NEXTAUTH_URL="https://gallerypavilion.com"      # Must include www if that's your domain
```

### Step 4: Redeploy Application

After setting environment variables:

1. Go to **Deployments** tab in Vercel
2. Click **Redeploy** on the latest deployment
3. Or push a new commit to trigger deployment

## Advanced Troubleshooting

### Check Current Environment Variables

Create a temporary debug endpoint to verify environment variables (remove after testing):

```typescript
// src/app/api/debug/env/route.ts
import { NextResponse } from 'next/server'

export async function GET() {
  // Only enable in development or with admin key
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }
  
  return NextResponse.json({
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'SET' : 'MISSING',
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'MISSING',
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'MISSING'
  })
}
```

### Test Authentication Flow

1. Clear browser cookies for the domain
2. Try logging in with test credentials:
   - Email: `vameh09@gmail.com`
   - Password: `correctpassword123`

### Verify Database Connection

Ensure the production database has the photographer account:

```sql
-- Check if photographer exists
SELECT u.email, u.role, p.status 
FROM "User" u 
LEFT JOIN "Photographer" p ON u.id = p."userId" 
WHERE u.email = 'vameh09@gmail.com';
```

## Common Solutions

### Solution 1: Environment Variable Scope

Ensure variables are set for the correct environment:
- Development: for local testing
- Preview: for preview deployments
- **Production**: for live site

### Solution 2: Clear All Sessions

If there are corrupted sessions:

```bash
# Call the clear sessions endpoint
curl -X POST https://www.gallerypavilion.com/api/auth/clear-all-sessions
```

### Solution 3: Cookie Configuration

Verify cookie settings in auth.ts:

```typescript
cookies: {
  sessionToken: {
    name: isHttps ? '__Secure-next-auth.session-token' : 'next-auth.session-token',
    options: {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      secure: isHttps, // Must be true for HTTPS
    }
  },
}
```

### Solution 4: JWT Strategy Configuration

Ensure JWT strategy is properly configured:

```typescript
session: {
  strategy: 'jwt',
  maxAge: 7 * 24 * 60 * 60, // 7 days
  updateAge: 24 * 60 * 60, // Update every 24 hours
},
```

## Testing Checklist

- [ ] NEXTAUTH_SECRET is set in Vercel Production environment
- [ ] NEXTAUTH_URL matches exact production domain
- [ ] Database connection is working
- [ ] Photographer account exists with correct credentials
- [ ] Application has been redeployed after environment variable changes
- [ ] Browser cookies have been cleared
- [ ] HTTPS is properly configured

## Verification Steps

1. **Test Local Development**: Ensure login works locally
2. **Check Vercel Logs**: Look for authentication errors in function logs
3. **Test Production**: Try logging in on production site
4. **Monitor Network**: Check browser dev tools for 401 errors

## Emergency Fallback

If the issue persists, you can temporarily use the admin login:

1. Go to `/auth/signin`
2. Use admin credentials
3. Navigate to admin panel to manage photographers

## Prevention

1. **Environment Variable Documentation**: Keep `.env.example` updated
2. **Deployment Checklist**: Verify environment variables before each deployment
3. **Monitoring**: Set up alerts for authentication failures
4. **Backup Authentication**: Ensure admin access always works

## Related Files

- `src/lib/auth.ts` - NextAuth configuration
- `src/app/api/auth/[...nextauth]/route.ts` - NextAuth route handler
- `.env.example` - Environment variable template
- `VERCEL_401_FIX.md` - Additional troubleshooting guide

## Support

If the issue persists after following this guide:

1. Check Vercel function logs for detailed error messages
2. Verify all environment variables are correctly set
3. Test with a fresh browser session (incognito mode)
4. Contact support with specific error messages and steps taken