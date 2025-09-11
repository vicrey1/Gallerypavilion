# Deploying to Vercel

This guide will help you deploy your Next.js photography marketplace application to Vercel.

## Prerequisites

1. A Vercel account (sign up at [vercel.com](https://vercel.com))
2. Your code pushed to a Git repository (GitHub, GitLab, or Bitbucket)
3. A production MySQL database (the current Aiven MySQL setup should work)

## Step 1: Prepare Your Repository

1. Ensure all your code is committed and pushed to your Git repository
2. Make sure the `.env` file is **NOT** committed (it should be in `.gitignore`)
3. The `.env.example` file should be committed as a reference

## Step 2: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "New Project"
3. Import your Git repository
4. Vercel will automatically detect it's a Next.js project
5. Click "Deploy"

### Option B: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy from your project directory
vercel
```

## Step 3: Configure Environment Variables

After deployment, you need to add environment variables in the Vercel dashboard:

1. Go to your project in Vercel dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variables:

### Required Environment Variables

| Variable | Value | Notes |
|----------|-------|-------|
| `DATABASE_URL` | `mysql://username:password@your-host:port/database?ssl-mode=REQUIRED` | Your Aiven MySQL database connection string |
| `NEXTAUTH_URL` | `https://your-app-name.vercel.app` | Replace with your actual Vercel domain |
| `NEXTAUTH_SECRET` | `your-nextauth-secret-here` | Generate a secure random string (32+ characters) |
| `EMAIL_SERVER_HOST` | `smtp.gmail.com` | |
| `EMAIL_SERVER_PORT` | `587` | |
| `EMAIL_SERVER_USER` | `Luxhedge00@gmail.com` | Your Gmail address |
| `EMAIL_SERVER_PASSWORD` | `qzau zhuw azsl tkdz` | Your Gmail App Password |
| `EMAIL_FROM` | `Luxhedge00@gmail.com` | |
| `APP_URL` | `https://your-app-name.vercel.app` | Replace with your actual Vercel domain |
| `ADMIN_EMAIL` | `admin@yoursite.com` | |
| `ADMIN_PASSWORD` | `admin123` | Consider using a stronger password |

### Important Notes:

- **NEXTAUTH_URL** and **APP_URL**: Replace `your-app-name` with your actual Vercel app name
- **Database**: Your existing Aiven MySQL database should work fine with Vercel
- **Email**: Make sure you're using a Gmail App Password, not your regular password

## Step 4: Database Setup

Since you're already using Aiven MySQL cloud database, no additional database setup is needed. The existing `DATABASE_URL` will work with Vercel.

### Run Database Migrations (if needed)

If you need to run Prisma migrations on your production database:

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Seed database (optional)
npx prisma db seed
```

## Step 5: Custom Domain (Optional)

To use a custom domain:

1. Go to your project in Vercel dashboard
2. Navigate to **Settings** → **Domains**
3. Add your custom domain
4. Update `NEXTAUTH_URL` and `APP_URL` environment variables to use your custom domain

## Step 6: Verify Deployment

1. Visit your Vercel app URL
2. Test key functionality:
   - User registration/login
   - Email sending
   - Database operations
   - Image uploads (if applicable)

## Troubleshooting

### Common Issues:

1. **Build Errors**: Check the build logs in Vercel dashboard
2. **Database Connection**: Ensure `DATABASE_URL` is correctly set
3. **Email Issues**: Verify Gmail App Password is correct
4. **Authentication Issues**: Check `NEXTAUTH_URL` and `NEXTAUTH_SECRET`

### Build Optimization:

- The `vercel.json` file is configured to optimize API routes
- Build time is limited to 30 seconds for API functions
- External packages like Prisma and bcryptjs are properly configured

## Security Considerations

1. **Environment Variables**: Never commit `.env` files
2. **Secrets**: Use strong, unique secrets for production
3. **Database**: Ensure your database has proper access controls
4. **Admin Password**: Use a strong admin password in production

## Monitoring

- Use Vercel's built-in analytics and monitoring
- Check function logs in the Vercel dashboard
- Monitor database performance in Aiven dashboard

Your application should now be successfully deployed to Vercel! 🚀