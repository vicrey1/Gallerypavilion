# Admin Login Error Debugging Guide

## Quick Diagnosis Steps

### Step 1: Identify the Error Type

**What error message are you seeing?**

- [ ] "Invalid admin credentials"
- [ ] "Access denied - Admin privileges required"
- [ ] "Session establishment failed"
- [ ] "An error occurred during login"
- [ ] Network/connection error
- [ ] Page not loading
- [ ] Other: ________________

### Step 2: Check Browser Console

1. Open browser Developer Tools (F12)
2. Go to **Console** tab
3. Try logging in again
4. Look for any red error messages

**Common Console Errors:**
```
- Failed to fetch
- 500 Internal Server Error
- CORS error
- NextAuth session error
- Database connection error
```

### Step 3: Verify Admin Credentials

**Correct Admin Credentials:**
- Email: `admin@gallerypavilion.com`
- Password: `admin123`

**Common Mistakes:**
- Using different email format
- Incorrect password
- Extra spaces in email/password
- Caps lock enabled

### Step 4: Test Database Connection

**Local Testing:**
1. Visit: http://localhost:3001/api/admin/seed
2. This should show if admin user exists

**Production Testing:**
1. Visit: https://gallerypavilion.com/api/admin/seed
2. Check if admin user exists in production database

## Environment Variable Checklist

### Local Development (.env.local)
```bash
✓ DATABASE_URL="postgresql://..."
✓ NEXTAUTH_SECRET="your-secret-key"
✓ NEXTAUTH_URL="http://localhost:3001"
✓ ADMIN_EMAIL="admin@gallerypavilion.com"
✓ ADMIN_PASSWORD="admin123"
```

### Production (Vercel)
```bash
✓ DATABASE_URL or PRISMA_DATABASE_URL
✓ NEXTAUTH_SECRET
✓ NEXTAUTH_URL="https://gallerypavilion.com"
✓ ADMIN_EMAIL="admin@gallerypavilion.com"
✓ ADMIN_PASSWORD="admin123"
✓ APP_URL="https://gallerypavilion.com"
```

## Common Error Solutions

### Error: "Invalid admin credentials"

**Cause:** Wrong email/password or admin user doesn't exist

**Solutions:**
1. Double-check credentials
2. Run database seed script
3. Check if admin user exists in database

```bash
# Create admin user
POST /api/admin/seed?secret=YOUR_SEED_SECRET
```

### Error: "Session establishment failed"

**Cause:** NextAuth session configuration issue

**Solutions:**
1. Check NEXTAUTH_URL matches current domain
2. Verify NEXTAUTH_SECRET is set
3. Clear browser cookies and try again

### Error: "Access denied - Admin privileges required"

**Cause:** User exists but doesn't have admin role

**Solutions:**
1. Check user role in database
2. Update user role to 'admin'
3. Re-run seed script

### Error: "Database connection failed"

**Cause:** DATABASE_URL is incorrect or database is down

**Solutions:**
1. Verify DATABASE_URL format
2. Test database connectivity
3. Check Vercel Postgres status

## Step-by-Step Debugging

### 1. Test Local Login

```bash
# Start local server
npm run dev

# Visit login page
http://localhost:3001/auth/admin-login

# Try logging in with:
# Email: admin@gallerypavilion.com
# Password: admin123
```

### 2. Check Database

```bash
# Check if admin exists (local)
GET http://localhost:3001/api/admin/seed

# Create admin if needed (local)
POST http://localhost:3001/api/admin/seed?secret=YOUR_SECRET
```

### 3. Test Production

```bash
# Check production admin
GET https://gallerypavilion.com/api/admin/seed

# Create production admin
POST https://gallerypavilion.com/api/admin/seed?secret=Cronaldo-985
```

### 4. Verify Environment Variables

**Vercel Dashboard:**
1. Go to project settings
2. Check Environment Variables section
3. Ensure all required variables are set
4. Redeploy after changes

## Advanced Debugging

### Enable NextAuth Debug Mode

Add to .env.local:
```bash
NEXTAUTH_DEBUG=true
```

### Check Server Logs

**Local:**
- Check terminal output during login attempt

**Production:**
- Check Vercel function logs
- Go to Vercel Dashboard → Functions → View logs

### Database Query Testing

```sql
-- Check if admin user exists
SELECT * FROM "User" WHERE email = 'admin@gallerypavilion.com';

-- Check user role
SELECT id, email, role FROM "User" WHERE email = 'admin@gallerypavilion.com';
```

## Quick Fixes

### Fix 1: Reset Admin User

```bash
# Delete and recreate admin
DELETE FROM "User" WHERE email = 'admin@gallerypavilion.com';

# Then run seed script
POST /api/admin/seed?secret=YOUR_SECRET
```

### Fix 2: Clear Browser Data

1. Clear cookies for the domain
2. Clear localStorage
3. Hard refresh (Ctrl+F5)
4. Try incognito/private mode

### Fix 3: Redeploy Application

1. Go to Vercel Dashboard
2. Click "Redeploy" on latest deployment
3. Wait for deployment to complete
4. Test login again

## Contact Information

If none of these solutions work, provide:

1. **Exact error message**
2. **Browser console logs**
3. **Environment (local/production)**
4. **Steps to reproduce**
5. **Screenshots if applicable**

## Emergency Access

If admin login is completely broken:

1. **Create temporary admin via API**
2. **Use database direct access**
3. **Deploy with debug mode enabled**
4. **Check Vercel function logs**

Remember: Always test locally first, then apply fixes to production!