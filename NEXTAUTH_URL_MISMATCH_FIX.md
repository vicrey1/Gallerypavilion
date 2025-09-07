# NextAuth URL Mismatch Issue - Comprehensive Fix

## 🚨 Critical Issue Identified

There's a **URL mismatch** between different configuration sources that's causing the 401 Unauthorized error:

### Current Configuration Conflicts:
1. **Vercel Environment Variables**: `NEXTAUTH_URL=https://gallerypavilion.com` (no www)
2. **Local .env.production**: `NEXTAUTH_URL=https://www.gallerypavilion.com` (with www)
3. **Previous hardcoded redirect**: Was using `https://www.gallerypavilion.com`

## 🔧 Required Fixes

### 1. Update Vercel Environment Variables
In your Vercel dashboard, update these variables to match your actual domain:

```
NEXTAUTH_URL=https://gallerypavilion.com
NEXTAUTH_URL_INTERNAL=https://gallerypavilion.com
```

### 2. Update Local .env.production
Change the local file to match Vercel:

```
NEXTAUTH_URL="https://gallerypavilion.com"
NEXTAUTH_URL_INTERNAL="https://gallerypavilion.com"
```

### 3. Verify Domain Configuration
Make sure your Vercel project is configured to use the correct domain:
- Primary domain: `gallerypavilion.com`
- Redirect www to non-www (or vice versa)

## 🎯 Root Cause

NextAuth.js is very strict about URL matching. When:
- The callback URL doesn't match the configured `NEXTAUTH_URL`
- There's a mismatch between www and non-www versions
- The redirect callback tries to redirect to a different domain

It results in a **401 Unauthorized** error during the authentication flow.

## ✅ Verification Steps

1. **Check Vercel Environment Variables**:
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Verify `NEXTAUTH_URL` matches your actual domain

2. **Test Authentication Flow**:
   - Try photographer login after the fix
   - Check browser network tab for any 401 errors
   - Verify successful redirect after login

3. **Check Domain Configuration**:
   - Ensure your domain redirects are consistent
   - Test both www and non-www versions

## 🚀 Expected Result

After fixing the URL mismatch:
- Photographer login should work correctly
- No more 401 Unauthorized errors
- Proper redirects after authentication
- Consistent URL handling across the application

## 📝 Additional Notes

- Always use the same URL format (with or without www) across all configurations
- NextAuth.js callback URLs must exactly match the `NEXTAUTH_URL` setting
- Consider setting up proper domain redirects in Vercel to avoid confusion