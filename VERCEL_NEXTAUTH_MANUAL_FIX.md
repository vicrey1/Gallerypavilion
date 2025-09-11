# Manual Vercel NextAuth Configuration Fix

## Current Issue
The 401 error persists despite our fixes, indicating the NEXTAUTH_SECRET is still not properly configured in Vercel's environment variables.

## Step-by-Step Vercel Fix

### 1. Access Vercel Dashboard
1. Go to [vercel.com](https://vercel.com) and log in
2. Navigate to your `gallerypavilion` project
3. Click on **Settings** tab
4. Click on **Environment Variables** in the left sidebar

### 2. Verify/Add NEXTAUTH_SECRET
**Critical**: The environment variable MUST be set exactly as shown:

**Variable Name**: `NEXTAUTH_SECRET`
**Value**: `26f9190b3499f89797803257e86f4753cfc6ec6fc912992936695d38098d9089`
**Environment**: `Production` (and optionally Preview/Development)

### 3. Check Other Required Variables
Ensure these are also set in Vercel:

```
NEXTAUTH_URL=https://gallerypavilion.com
NEXTAUTH_URL_INTERNAL=https://gallerypavilion.com
DATABASE_URL=your_production_database_url
ADMIN_EMAIL=admin@gallerypavilion.com
ADMIN_PASSWORD=admin123
```

### 4. Enable System Environment Variables
1. In Vercel project settings
2. Go to **General** tab
3. Scroll to **System Environment Variables**
4. Ensure **Automatically expose System Environment Variables** is **CHECKED**

### 5. Force Redeploy
**Important**: Environment variable changes require a new deployment:

1. Go to **Deployments** tab in Vercel
2. Click the **⋯** menu on the latest deployment
3. Click **Redeploy**
4. Wait for deployment to complete

### 6. Clear Browser Data
After redeployment:
1. Clear browser cookies for `gallerypavilion.com`
2. Clear browser cache
3. Try photographer login again

## Verification Steps

### Check Environment Variables
1. In Vercel dashboard, verify all variables are visible
2. Ensure no typos in variable names or values
3. Confirm variables are set for "Production" environment

### Test Authentication
1. Visit: `https://gallerypavilion.com/auth/photographer-login`
2. Try logging in with photographer credentials
3. Check browser developer tools for any JWT errors

### Monitor Deployment Logs
1. Go to Vercel **Functions** tab
2. Check real-time logs during login attempts
3. Look for JWT_SESSION_ERROR or NEXTAUTH_SECRET errors

## Common Issues

### Environment Variable Not Taking Effect
- **Solution**: Force redeploy after setting variables
- **Reason**: Vercel caches builds and doesn't automatically rebuild for env changes

### Still Getting JWT Errors
- **Check**: Variable name is exactly `NEXTAUTH_SECRET` (case-sensitive)
- **Check**: Value has no extra spaces or quotes
- **Check**: Variable is set for Production environment

### 401 Persists After Fix
- **Clear**: All browser cookies and localStorage
- **Wait**: 2-3 minutes for Vercel edge cache to update
- **Try**: Incognito/private browsing mode

## Emergency Alternative

If the issue persists, generate a new secret:

1. Run locally: `openssl rand -base64 32`
2. Update both `.env.production` and Vercel environment variables
3. Commit and push the local change
4. Redeploy in Vercel

## Expected Result

After proper configuration:
- No JWT_SESSION_ERROR in Vercel logs
- Successful photographer login
- Proper session persistence
- No 401 errors on authentication endpoints