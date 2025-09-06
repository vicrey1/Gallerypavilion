# Vercel Deployment Fixes

This guide addresses the key issues that need to be fixed for successful Vercel deployment.

## Issues to Fix

### 1. Environment Variables Configuration

**Problem**: The current `.env.local` has development values that won't work in production.

**Solution**: Configure these environment variables in your Vercel dashboard:

#### Required Environment Variables for Vercel:

```bash
# Database (automatically provided by Vercel Postgres)
DATABASE_URL="postgresql://..." # Set by Vercel Postgres

# NextAuth Configuration
NEXTAUTH_SECRET="28ec8243d5fe2c65fce850988be5e00a038827222a7bdcdc59d083b932f32ceb"
NEXTAUTH_URL="https://your-app-name.vercel.app" # Replace with your actual Vercel domain

# Application URLs
APP_URL="https://your-app-name.vercel.app" # Same as NEXTAUTH_URL

# Admin Configuration
ADMIN_EMAIL="admin@gallerypavilion.com"
ADMIN_PASSWORD="admin123" # Change this in production!

# Email Configuration (if using email features)
EMAIL_SERVER_HOST="smtp.gmail.com"
EMAIL_SERVER_PORT="587"
EMAIL_SERVER_USER="your-email@gmail.com"
EMAIL_SERVER_PASSWORD="your-app-password" # Gmail App Password
EMAIL_FROM="your-email@gmail.com"
```

### 2. Database Setup

**Status**: ✅ Already Fixed
- Prisma schema is correctly configured for PostgreSQL
- DATABASE_URL is properly formatted for Vercel Postgres

### 3. Build Configuration

**Status**: ✅ Already Configured
- `vercel.json` is properly set up
- `package.json` build script includes Prisma generation

## Step-by-Step Deployment Process

### Step 1: Create Vercel Postgres Database

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Navigate to **Storage** tab
3. Click **Create Database** → **Postgres**
4. Choose name and region
5. Copy the `DATABASE_URL` connection string

### Step 2: Deploy to Vercel

1. Push your code to GitHub/GitLab/Bitbucket
2. Go to [Vercel Dashboard](https://vercel.com/dashboard)
3. Click **New Project**
4. Import your repository
5. Vercel will auto-detect Next.js
6. Click **Deploy**

### Step 3: Configure Environment Variables

1. Go to your project in Vercel dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add all the variables listed above
4. **Important**: Replace `your-app-name` with your actual Vercel app name

### Step 4: Seed Production Database

After deployment, seed your database with the admin user:

```bash
# Method 1: Using the API endpoint
curl -X POST "https://your-app-name.vercel.app/api/admin/seed?secret=your-seed-secret"

# Method 2: Using Vercel CLI
vercel env pull .env.production
npm run seed:production
```

### Step 5: Test Deployment

1. Visit your Vercel app URL
2. Test admin login at `/auth/admin-login`
3. Use credentials: `admin@gallerypavilion.com` / `admin123`
4. **Important**: Change admin password after first login!

## Common Issues and Solutions

### Issue 1: "NEXTAUTH_URL Mismatch"
**Solution**: Ensure `NEXTAUTH_URL` and `APP_URL` match your actual Vercel domain

### Issue 2: "Database Connection Failed"
**Solution**: Verify `DATABASE_URL` is correctly set by Vercel Postgres

### Issue 3: "Authentication Not Working"
**Solution**: Check that `NEXTAUTH_SECRET` is set and `NEXTAUTH_URL` is correct

### Issue 4: "Build Failures"
**Solution**: Ensure all dependencies are in `package.json` and Prisma generates correctly

## Security Checklist

- [ ] Generate new `NEXTAUTH_SECRET` for production
- [ ] Change default admin password after first login
- [ ] Use Gmail App Password (not regular password) for email
- [ ] Verify all environment variables are set in Vercel dashboard
- [ ] Test authentication flows in production

## Post-Deployment Tasks

1. **Update DNS** (if using custom domain)
2. **Configure custom domain** in Vercel dashboard
3. **Update environment variables** to use custom domain
4. **Test all functionality** in production
5. **Monitor logs** in Vercel dashboard

## Quick Fix Commands

```bash
# Generate new NEXTAUTH_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Test database connection
npx prisma db execute --stdin

# Deploy with Vercel CLI
vercel --prod

# Check deployment logs
vercel logs
```

Your application should now deploy successfully to Vercel! 🚀