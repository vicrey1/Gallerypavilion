# Fix Admin Login Issue on Vercel Production

## Problem Identified
The admin login at https://www.gallerypavilion.com/auth/admin-login is failing because **critical environment variables are missing** in your Vercel deployment.

## Missing Environment Variables

Based on your current Vercel configuration, you need to add these **CRITICAL** variables:

### 1. Admin Credentials (MISSING - CRITICAL)
```
ADMIN_EMAIL=admin@gallerypavilion.com
ADMIN_PASSWORD=admin123
```

### 2. Database Configuration (NEEDS FIXING)
```
# You have PRISMA_DATABASE_URL but need DATABASE_URL
DATABASE_URL=postgresql://username:password@localhost:5432/gallerypavilion
# OR use the same value as PRISMA_DATABASE_URL
```

## Step-by-Step Fix

### Step 1: Add Missing Environment Variables in Vercel

1. Go to your Vercel dashboard
2. Navigate to your project settings
3. Go to "Environment Variables" section
4. Add these variables:

```bash
# Admin Authentication (CRITICAL)
ADMIN_EMAIL=admin@gallerypavilion.com
ADMIN_PASSWORD=admin123

# Database URL (if not already set)
DATABASE_URL=postgresql://username:password@host:5432/database
# OR copy the value from PRISMA_DATABASE_URL
```

### Step 2: Verify Current Environment Variables

Your current Vercel environment variables:
✅ `APP_URL` = `https://gallerypavilion.com`
✅ `NEXTAUTH_URL` = `https://gallerypavilion.com`
✅ `NEXTAUTH_SECRET` = `h1tA+EK2Hp0zCrRZBD5CNUbJBWK2lLlFaMf0HPK6ZKs=`
✅ `PRISMA_DATABASE_URL` = (Prisma Accelerate URL)
✅ `EMAIL_SERVER_*` = (Gmail SMTP configuration)
❌ `ADMIN_EMAIL` = **MISSING**
❌ `ADMIN_PASSWORD` = **MISSING**
❌ `DATABASE_URL` = **MISSING**

### Step 3: Database Configuration Fix

You have `PRISMA_DATABASE_URL` but your application might be looking for `DATABASE_URL`. 

**Option A: Set DATABASE_URL to same value as PRISMA_DATABASE_URL**
```
DATABASE_URL=prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqd3RfaWQiOjEsInNlY3VyZV9rZXkiOiJza19Ua29PQW9Ka3ZpLXFBNndLZDV6dEMiLCJhcGlfa2V5IjoiMDFLNEE0MzhLS0hWR1AyN1haMFhNNDJEMjIiLCJ0ZW5hbnRfaWQiOiJiMThjNTM5NWFhM2QwZTUxZTIzMmFhZTg2YjI0Yzk5NzZiYmEzNWI5MjQwOWViYzhlNmRlZGI3NmJhN2JiNDQ2IiwiaW50ZXJuYWxfc2VjcmV0IjoiODZhMTUyNWEtZmQxNy00YzVkLWFjNmMtMTJmYmVkZDQ3ZWE0In0.kf7UFt3BAkX0kz23bkBNnGDBGlkNZkzubysr_uTViQg
```

**Option B: Use direct PostgreSQL connection**
```
DATABASE_URL=postgresql://username:password@host:5432/database
```

### Step 4: Redeploy

1. After adding all environment variables
2. Go to Vercel dashboard → Deployments
3. Click "Redeploy" on the latest deployment
4. Wait for deployment to complete

### Step 5: Test Admin Login

1. Visit: https://www.gallerypavilion.com/auth/admin-login
2. Use credentials:
   - Email: `admin@gallerypavilion.com`
   - Password: `admin123`

## Quick Verification Commands

To verify the admin user exists in your database, you can create a test API route:

```typescript
// pages/api/test-admin.ts
import { prisma } from '@/lib/prisma';

export default async function handler(req, res) {
  try {
    const admin = await prisma.user.findUnique({
      where: { email: process.env.ADMIN_EMAIL }
    });
    
    res.json({ 
      adminExists: !!admin,
      adminEmail: process.env.ADMIN_EMAIL,
      hasPassword: !!admin?.password
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
```

## Common Issues After Fix

1. **Admin user doesn't exist**: Run the seed script to create admin user
2. **Password mismatch**: Ensure ADMIN_PASSWORD matches the hashed password in database
3. **Database connection**: Verify DATABASE_URL is correctly set

## Priority Actions

1. 🔴 **CRITICAL**: Add `ADMIN_EMAIL` and `ADMIN_PASSWORD` to Vercel
2. 🔴 **CRITICAL**: Set `DATABASE_URL` environment variable
3. 🟡 **IMPORTANT**: Redeploy the application
4. 🟢 **VERIFY**: Test admin login functionality

Once these environment variables are added and the application is redeployed, the admin login should work correctly.