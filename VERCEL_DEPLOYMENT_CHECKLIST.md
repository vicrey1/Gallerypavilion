# Vercel Deployment Checklist - NextAuth 401 Fix

## Immediate Action Required

The 401 error `Callback for provider type credentials not supported` indicates missing or incorrect NextAuth configuration in production.

## Step 1: Verify Vercel Environment Variables

### Go to Vercel Dashboard
1. Visit [vercel.com/dashboard](https://vercel.com/dashboard)
2. Select your project: `gallerypavilion`
3. Go to **Settings** → **Environment Variables**

### Required Variables for Production Environment

**CRITICAL - NextAuth Configuration:**
```bash
NEXTAUTH_SECRET="26f9190b3499f89797803257e86f4753cfc6ec6fc912992936695d38098d9089"
NEXTAUTH_URL="https://www.gallerypavilion.com"
NEXTAUTH_URL_INTERNAL="https://www.gallerypavilion.com"
```

**Database Configuration:**
```bash
DATABASE_URL="postgres://b18c5395aa3d0e51e232aae86b24c9976bba35b92409ebc8e6dedb76ba7bb446:sk_TkoOAoJkvi-qA6wKd5ztC@db.prisma.io:5432/postgres?sslmode=require"
POSTGRES_URL="postgres://b18c5395aa3d0e51e232aae86b24c9976bba35b92409ebc8e6dedb76ba7bb446:sk_TkoOAoJkvi-qA6wKd5ztC@db.prisma.io:5432/postgres?sslmode=require"
PRISMA_DATABASE_URL="prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqd3RfaWQiOjEsInNlY3VyZV9rZXkiOiJza19Ua29PQW9Ka3ZpLXFBNndLZDV6dEMiLCJhcGlfa2V5IjoiMDFLNEE0MzhLS0hWR1AyN1haMFhNNDJEMjIiLCJ0ZW5hbnRfaWQiOiJiMThjNTM5NWFhM2QwZTUxZTIzMmFhZTg2YjI0Yzk5NzZiYmEzNWI5MjQwOWViYzhlNmRlZGI3NmJhN2JiNDQ2IiwiaW50ZXJuYWxfc2VjcmV0IjoiODZhMTUyNWEtZmQxNy00YzVkLWFjNmMtMTJmYmVkZDQ3ZWE0In0.kf7UFt3BAkX0kz23bkBNnGDBGlkNZkzubysr_uTViQg"
```

**Admin Credentials:**
```bash
ADMIN_EMAIL="admin@gallerypavilion.com"
ADMIN_PASSWORD="admin123"
ADMIN_RESET_KEY="admin123"
```

**Application Configuration:**
```bash
NODE_ENV="production"
NEXT_PUBLIC_APP_URL="https://www.gallerypavilion.com"
```

## Step 2: Environment Variable Setup Instructions

### For Each Variable:
1. Click **Add New** in Environment Variables section
2. Enter **Name** (e.g., `NEXTAUTH_SECRET`)
3. Enter **Value** (the actual secret/URL)
4. Select **Production** environment
5. Click **Save**

### Critical Notes:
- ✅ **NEXTAUTH_URL** must be exactly `https://www.gallerypavilion.com` (no trailing slash)
- ✅ **NEXTAUTH_SECRET** must be the 64-character hex string provided
- ✅ All variables must be set for **Production** environment
- ✅ Database URLs must match exactly (including SSL parameters)

## Step 3: Redeploy Application

After setting all environment variables:

1. Go to **Deployments** tab
2. Find the latest deployment
3. Click **⋯** (three dots) → **Redeploy**
4. Wait for deployment to complete

## Step 4: Test Authentication

### Test Photographer Login:
1. Go to: https://www.gallerypavilion.com/auth/signin
2. Use credentials:
   - Email: `vameh09@gmail.com`
   - Password: `correctpassword123`
3. Should redirect to photographer dashboard

### Test Admin Login:
1. Go to: https://www.gallerypavilion.com/auth/signin
2. Use credentials:
   - Email: `admin@gallerypavilion.com`
   - Password: `admin123`
3. Should redirect to admin dashboard

## Step 5: Verify Deployment

### Check Vercel Function Logs:
1. Go to **Functions** tab in Vercel
2. Look for `/api/auth/[...nextauth]` function
3. Check for any error logs

### Monitor Network Requests:
1. Open browser DevTools (F12)
2. Go to Network tab
3. Try logging in
4. Check for 401 errors in `/api/auth/callback/photographer-login`

## Common Issues & Solutions

### Issue 1: NEXTAUTH_URL Mismatch
**Symptoms:** 401 errors, callback failures
**Solution:** Ensure NEXTAUTH_URL exactly matches your domain
```bash
# Correct
NEXTAUTH_URL="https://www.gallerypavilion.com"

# Incorrect
NEXTAUTH_URL="https://www.gallerypavilion.com/"  # No trailing slash
NEXTAUTH_URL="https://gallerypavilion.com"       # Must include www
```

### Issue 2: Missing NEXTAUTH_SECRET
**Symptoms:** JWT errors, session failures
**Solution:** Set the exact secret from local environment
```bash
NEXTAUTH_SECRET="26f9190b3499f89797803257e86f4753cfc6ec6fc912992936695d38098d9089"
```

### Issue 3: Database Connection Issues
**Symptoms:** User not found errors
**Solution:** Verify database URLs and run seed script if needed

### Issue 4: Environment Variable Scope
**Symptoms:** Variables work locally but not in production
**Solution:** Ensure variables are set for **Production** environment, not just Preview

## Emergency Fallback

If photographer login still fails:

1. **Use Admin Login:**
   - Go to `/auth/signin`
   - Login as admin
   - Navigate to admin panel
   - Manage photographers from there

2. **Check Database:**
   - Verify photographer account exists
   - Check password hash is correct
   - Ensure photographer status is approved

## Verification Checklist

- [ ] All environment variables set in Vercel Production
- [ ] NEXTAUTH_URL matches exact domain (with www, no trailing slash)
- [ ] NEXTAUTH_SECRET is the 64-character hex string
- [ ] Database URLs are correct and accessible
- [ ] Application has been redeployed after setting variables
- [ ] Photographer login works: `vameh09@gmail.com` / `correctpassword123`
- [ ] Admin login works: `admin@gallerypavilion.com` / `admin123`
- [ ] No 401 errors in browser network tab
- [ ] Vercel function logs show no authentication errors

## Files Updated

- ✅ `vercel.json` - Added authentication headers and fixed function paths
- ✅ `.env.production` - Updated with all required variables
- ✅ `NEXTAUTH_CALLBACK_FIX.md` - Comprehensive troubleshooting guide

## Next Steps

Once authentication is working:

1. Test all user flows (photographer, admin, client)
2. Verify image upload functionality
3. Test gallery creation and sharing
4. Monitor for any remaining errors

## Support

If issues persist after following this checklist:

1. Check Vercel function logs for specific error messages
2. Test in incognito mode to rule out browser cache issues
3. Verify all environment variables are exactly as specified
4. Contact support with specific error messages and steps taken