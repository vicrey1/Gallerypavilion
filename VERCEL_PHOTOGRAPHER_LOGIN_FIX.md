# Vercel Photographer Login Fix Guide

## Problem
Photographer login works locally but fails on Vercel/gallerypavilion.com with authentication errors.

## Quick Fix Steps

### 1. Deploy the Debug API

First, deploy the current code to Vercel to get the debug API endpoint:

```bash
git add .
git commit -m "Add photographer login debug API"
git push origin main
```

### 2. Set Debug Secret (Optional but Recommended)

In Vercel Dashboard:
1. Go to your project settings
2. Add environment variable: `DEBUG_SECRET=your-secret-key-here`
3. Redeploy

### 3. Run Diagnosis

Visit: `https://gallerypavilion.com/api/debug/photographer-login`

Or with secret: `https://gallerypavilion.com/api/debug/photographer-login?secret=your-secret-key-here`

This will show:
- Environment variables status
- Database connection
- Photographer records
- Test user status
- Recommendations

### 4. Run Auto-Fix

Visit: `https://gallerypavilion.com/api/debug/photographer-login?action=fix`

Or with secret: `https://gallerypavilion.com/api/debug/photographer-login?action=fix&secret=your-secret-key-here`

This will:
- Create/update test photographer user
- Ensure photographer profile exists
- Fix missing photographer records
- Set proper approval status

### 5. Test Login

After running the fix, test at: `https://gallerypavilion.com/auth/photographer-login`

Credentials:
- Email: `vameh09@gmail.com`
- Password: `Cronaldo7`

## Common Issues & Solutions

### Issue 1: NEXTAUTH_URL Mismatch
**Symptom:** Authentication redirects fail
**Solution:** Set `NEXTAUTH_URL=https://gallerypavilion.com` in Vercel environment variables

### Issue 2: Missing NEXTAUTH_SECRET
**Symptom:** Session/JWT errors
**Solution:** Generate and set NEXTAUTH_SECRET:
```bash
openssl rand -base64 32
```
Add to Vercel environment variables

### Issue 3: Database Connection Issues
**Symptom:** Database errors in logs
**Solution:** Verify `DATABASE_URL` is correctly set in Vercel

### Issue 4: Missing Photographer Records
**Symptom:** User exists but no photographer profile
**Solution:** Run the auto-fix API endpoint

### Issue 5: Password Hash Mismatch
**Symptom:** Correct credentials rejected
**Solution:** The fix script will rehash passwords correctly

## Manual Database Fix (Alternative)

If the API fix doesn't work, run this script locally and push to production:

```bash
node fix-production-photographer-login.js
```

## Environment Variables Checklist

Ensure these are set in Vercel:

```env
# Required
DATABASE_URL=postgresql://...
NEXTAUTH_URL=https://gallerypavilion.com
NEXTAUTH_SECRET=your-generated-secret

# Optional for debugging
DEBUG_SECRET=your-debug-secret
```

## Verification Steps

1. ✅ Debug API returns successful diagnosis
2. ✅ Test photographer user exists with correct credentials
3. ✅ Photographer profile exists and is approved
4. ✅ Login at gallerypavilion.com/auth/photographer-login works
5. ✅ Redirects to dashboard after successful login

## Troubleshooting

If issues persist:

1. Check Vercel function logs:
   ```bash
   vercel logs
   ```

2. Check database directly in Vercel dashboard

3. Verify all environment variables are set correctly

4. Ensure the latest code is deployed

5. Try the manual database fix script

## Security Notes

- The debug API includes security checks for production
- Remove or secure the debug endpoint after fixing
- Use strong passwords and secrets
- Regularly rotate NEXTAUTH_SECRET

## Success Indicators

You'll know it's fixed when:
- Debug API shows all green checks
- Login redirects properly to dashboard
- No 401 errors in browser network tab
- Session persists across page refreshes