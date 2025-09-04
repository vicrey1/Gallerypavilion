# Vercel Postgres Setup Guide

This guide will help you migrate from MySQL to Vercel Postgres.

## Steps to Complete the Migration

### 1. Create Vercel Postgres Database

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Navigate to the **Storage** tab
3. Click **Create Database**
4. Select **Postgres**
5. Choose your database name and region
6. Click **Create**

### 2. Get Database Connection String

1. After creating the database, go to the **Settings** tab
2. Copy the **DATABASE_URL** connection string
3. It should look like: `postgresql://username:password@hostname:port/database?sslmode=require`

### 3. Update Environment Variables

1. Replace the `DATABASE_URL` in your `.env` file with the Vercel Postgres connection string
2. The format should be:
   ```
   DATABASE_URL="postgresql://username:password@hostname:port/database?sslmode=require"
   ```

### 4. Reset and Run Migrations

Since we're switching database providers, you'll need to reset your migrations:

```bash
# Remove existing migration files (they're MySQL-specific)
Remove-Item -Recurse -Force .\prisma\migrations

# Create initial migration for PostgreSQL
npx prisma migrate dev --name init

# This will create the database schema and generate the Prisma client
```

### 5. Seed the Database (Optional)

If you have a seed file, run it to populate initial data:

```bash
npx prisma db seed
```

### 6. Start the Development Server

```bash
npm run dev
```

## What Has Been Changed

✅ **Prisma Schema**: Updated from `mysql` to `postgresql` provider
✅ **Dependencies**: Removed `mysql2`, added `pg` and `@types/pg`
✅ **Environment**: Updated `.env` with PostgreSQL connection string template
✅ **Prisma Client**: Regenerated for PostgreSQL compatibility

## Important Notes

- **Data Migration**: This setup creates a new database. Your existing MySQL data will not be automatically transferred.
- **Connection String**: Make sure to replace the placeholder DATABASE_URL with your actual Vercel Postgres connection string.
- **SSL**: Vercel Postgres requires SSL connections, which is included in the connection string format.
- **Migrations**: You'll need to recreate your database schema using the migration command above.

## Troubleshooting

- If you get connection errors, verify your DATABASE_URL is correct
- Ensure your Vercel Postgres database is active and accessible
- Check that your IP is whitelisted if using Vercel Postgres with IP restrictions

## Next Steps

After completing these steps, your application will be connected to Vercel Postgres instead of MySQL. All your existing application code will work the same way since Prisma abstracts the database differences.