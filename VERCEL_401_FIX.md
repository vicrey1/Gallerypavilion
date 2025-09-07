# Fix for Vercel 401 Unauthorized Error - NextAuth Credentials Provider

## Problem
The production site at `https://www.gallerypavilion.com` is returning a 401 Unauthorized error when attempting to use the photographer login callback: <mcreference link="https://www.gallerypavilion.com/api/auth/callback/photographer-login" index="0">0</mcreference>

```
POST https://www.gallerypavilion.com/api/auth/callback/photographer-login 401 (Unauthorized)
Error: Callback for provider type credentials not supported
```

## Root Cause
This error occurs when NextAuth.js environment variables are not properly configured in Vercel production environment, specifically:

1. **Missing NEXTAUTH_SECRET** - Required for JWT token encryption <mcreference link="https://next-auth.js.org/deployment" index="4">4</mcreference>
2. **Incorrect NEXTAUTH_URL** - Must match the production domain exactly <mcreference link="https://github.com/nextauthjs/next-auth/discussions/4602" index="5">5</mcreference>
3. **Environment variable scope** - Variables must be set for Production environment

## Immediate Fix Steps

### Step 1: Set Environment Variables in Vercel Dashboard

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add these variables for **Production** environment:

```bash
# Critical NextAuth Variables
NEXTAUTH_SECRET=26f9190b3499f89797803257e86f4753cfc6ec6fc912992936695d38098d9089
NEXTAUTH_URL=https://www.gallerypavilion.com
NEXTAUTH_URL_INTERNAL=https://www.gallerypavilion.com

# Database Configuration
DATABASE_URL=postgres://b18c5395aa3d0e51e232aae86b24c9976bba35b92409ebc8e6dedb76ba7bb446:sk_TkoOAoJkvi-qA6wKd5ztC@db.prisma.io:5432/postgres?sslmode=require
POSTGRES_URL=postgres://b18c5395aa3d0e51e232aae86b24c9976bba35b92409ebc8e6dedb76ba7bb446:sk_TkoOAoJkvi-qA6wKd5ztC@db.prisma.io:5432/postgres?sslmode=require
PRISMA_DATABASE_URL=prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqd3RfaWQiOjEsInNlY3VyZV9rZXkiOiJza19Ua29PQW9Ka3ZpLXFBNndLZDV6dEMiLCJhcGlfa2V5IjoiMDFLNEE0MzhLS0hWR1AyN1haMFhNNDJEMjIiLCJ0ZW5hbnRfaWQiOiJiMThjNTM5NWFhM2QwZTUxZTIzMmFhZTg2YjI0Yzk5NzZiYmEzNWI5MjQwOWViYzhlNmRlZGI3NmJhN2JiNDQ2IiwiaW50ZXJuYWxfc2VjcmV0IjoiODZhMTUyNWEtZmQxNy00YzVkLWFjNmMtMTJmYmVkZDQ3ZWE0In0.kf7UFt3BAkX0kz23bkBNnGDBGlkNZkzubysr_uTViQg

# Admin Credentials
ADMIN_EMAIL=admin@gallerypavilion.com
ADMIN_PASSWORD=admin123
ADMIN_RESET_KEY=admin123
```

### Step 2: Verify Environment Variable Scope

**CRITICAL**: Ensure all variables are set for:
- ✅ **Production** (most important)
- ✅ **Preview** 
- ✅ **Development**

### Step 3: Force Redeploy

After setting environment variables:
1. Go to **Deployments** tab in Vercel
2. Click **Redeploy** on the latest deployment
3. Select **Use existing Build Cache: No**
4. Click **Redeploy**

## Technical Details

### Why This Error Occurs

1. **Missing NEXTAUTH_SECRET**: NextAuth.js requires this for JWT encryption <mcreference link="https://stackoverflow.com/questions/67715077/next-auth-receiving-404-after-login-attempt-in-deployed-vercel-application" index="3">3</mcreference>
2. **URL Mismatch**: Production callbacks fail when NEXTAUTH_URL doesn't match the actual domain <mcreference link="https://stackoverflow.com/questions/79665557/what-could-be-causing-nextauth-with-google-provider-to-fail-in-production-verce" index="1">1</mcreference>
3. **Environment Scope**: Variables set only for Preview/Development won't work in Production

### Verification Steps

After redeployment, test these URLs:

1. **Photographer Login**: `https://www.gallerypavilion.com/auth/photographer-login`
2. **Admin Login**: `https://www.gallerypavilion.com/auth/admin-login`
3. **Invite Login**: `https://www.gallerypavilion.com/auth/invite-login`

### Expected Behavior

✅ **Success**: Login forms should submit without 401 errors
✅ **Redirect**: Successful authentication should redirect to dashboard
✅ **Session**: User session should persist across page reloads

## Common Pitfalls

❌ **Don't**: Add `NEXT_PUBLIC_` prefix to NextAuth variables
❌ **Don't**: Use localhost URLs in production environment
❌ **Don't**: Forget to redeploy after setting environment variables
❌ **Don't**: Set variables only for Preview environment

✅ **Do**: Use exact production domain in NEXTAUTH_URL
✅ **Do**: Set variables for all environments (Production, Preview, Development)
✅ **Do**: Force redeploy without build cache
✅ **Do**: Test all authentication flows after deployment

## Troubleshooting

If the error persists after following these steps:

1. **Check Vercel Function Logs**: Go to Functions tab and check for errors
2. **Verify Environment Variables**: Ensure they're visible in the deployment
3. **Test Locally**: Confirm the same configuration works in development
4. **Check Network Tab**: Look for additional error details in browser dev tools

## Additional Resources

- [NextAuth.js Deployment Guide](https://next-auth.js.org/deployment)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [NextAuth.js Credentials Provider](https://next-auth.js.org/providers/credentials)