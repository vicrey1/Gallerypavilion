# Production Database Seeding Guide

This guide will help you seed your Vercel Postgres production database with the admin user.

## Prerequisites

1. ✅ Vercel Postgres database created and configured
2. ✅ Production `DATABASE_URL` environment variable set in Vercel
3. ✅ Application deployed to Vercel

## Method 1: Seed via Vercel CLI (Recommended)

### Step 1: Install Vercel CLI
```bash
npm i -g vercel
```

### Step 2: Login to Vercel
```bash
vercel login
```

### Step 3: Link Your Project
```bash
vercel link
```

### Step 4: Run Production Seed
```bash
vercel env pull .env.production
npm run seed:production
```

## Method 2: Seed via Vercel Dashboard

### Step 1: Go to Vercel Dashboard
1. Navigate to your project in [Vercel Dashboard](https://vercel.com/dashboard)
2. Go to **Functions** tab
3. Click **Create Function**

### Step 2: Create Seed Function
Create a new API route at `/api/admin/seed` with the following content:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    // Security check - only allow in development or with secret key
    const { searchParams } = new URL(request.url)
    const secret = searchParams.get('secret')
    
    if (process.env.NODE_ENV === 'production' && secret !== process.env.SEED_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@gallerypavilion.com' }
    })
    
    if (existingAdmin) {
      return NextResponse.json({ 
        message: 'Admin user already exists',
        admin: { email: existingAdmin.email, role: existingAdmin.role }
      })
    }
    
    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 12)
    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@gallerypavilion.com',
        name: 'System Administrator',
        password: hashedPassword,
        role: 'admin',
        emailVerified: new Date()
      }
    })
    
    return NextResponse.json({
      message: 'Admin user created successfully',
      admin: {
        id: adminUser.id,
        email: adminUser.email,
        role: adminUser.role
      },
      credentials: {
        email: 'admin@gallerypavilion.com',
        password: 'admin123'
      }
    })
    
  } catch (error) {
    console.error('Seeding error:', error)
    return NextResponse.json({ error: 'Seeding failed' }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
```

### Step 3: Set Environment Variable
Add `SEED_SECRET` environment variable in Vercel dashboard with a secure random value.

### Step 4: Deploy and Run
1. Deploy your changes
2. Call the API: `POST https://your-app.vercel.app/api/admin/seed?secret=YOUR_SEED_SECRET`

## Method 3: Direct Database Access

If you have direct access to your Vercel Postgres database:

### Step 1: Connect to Database
```bash
psql "your-vercel-postgres-connection-string"
```

### Step 2: Run SQL Commands
```sql
-- Check if admin exists
SELECT * FROM "User" WHERE email = 'admin@gallerypavilion.com';

-- Create admin user (replace $2b$12$... with actual bcrypt hash)
INSERT INTO "User" (id, email, name, password, role, "emailVerified", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'admin@gallerypavilion.com',
  'System Administrator',
  '$2b$12$hash_here', -- Use bcrypt to hash 'admin123'
  'admin',
  NOW(),
  NOW(),
  NOW()
);
```

## Verification

After seeding, verify the admin user was created:

1. **Via API**: Create a test endpoint to check user existence
2. **Via Admin Login**: Try logging in at `https://your-app.vercel.app/auth/admin-login`
3. **Via Database**: Query the User table directly

## Admin Credentials

- **Email**: `admin@gallerypavilion.com`
- **Password**: `admin123`
- **Role**: `admin`

⚠️ **IMPORTANT**: Change the admin password immediately after first login in production!

## Troubleshooting

### Common Issues:

1. **Connection Error**: Verify `DATABASE_URL` is correct
2. **Permission Error**: Ensure database user has CREATE permissions
3. **Duplicate Error**: Admin user already exists
4. **Hash Error**: bcrypt version mismatch

### Debug Commands:

```bash
# Check database connection
npx prisma db execute --stdin

# View database schema
npx prisma db pull

# Generate fresh client
npx prisma generate
```

## Security Notes

- Never commit production database URLs
- Use strong passwords in production
- Rotate admin credentials regularly
- Monitor admin access logs
- Consider using environment-specific admin accounts