# Photographer Setup Guide

## Overview

This guide explains how to set up photographer accounts using environment variables instead of hardcoded values, ensuring security and flexibility across different environments.

## Environment Variables

The setup script (`setup-photographer.js`) requires the following environment variables:

### Required Variables

- `PHOTOGRAPHER_EMAIL` - Email address for the photographer account
- `PHOTOGRAPHER_PASSWORD` - Password for the photographer account

### Optional Variables

- `PHOTOGRAPHER_NAME` - Full name of the photographer (defaults to "Photographer")
- `PHOTOGRAPHER_BUSINESS_NAME` - Business name (optional)
- `PHOTOGRAPHER_PHONE` - Phone number (optional)
- `PHOTOGRAPHER_WEBSITE` - Website URL (optional)
- `PHOTOGRAPHER_PORTFOLIO` - Portfolio URL (optional)
- `PHOTOGRAPHER_EXPERIENCE` - Experience level (defaults to "Professional")
- `PHOTOGRAPHER_BIO` - Biography text (optional)

## Setup Instructions

### 1. Local Development

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Update the photographer variables in `.env.local`:
   ```env
   PHOTOGRAPHER_EMAIL="your-photographer@example.com"
   PHOTOGRAPHER_PASSWORD="your-secure-password"
   PHOTOGRAPHER_NAME="Your Name"
   PHOTOGRAPHER_BUSINESS_NAME="Your Photography Business"
   # ... other optional variables
   ```

3. Run the setup script:
   ```bash
   node setup-photographer.js
   ```

### 2. Production (Vercel)

1. Set environment variables in Vercel Dashboard:
   - Go to your project settings
   - Navigate to Environment Variables
   - Add all required photographer variables

2. Deploy your application or trigger a redeploy

3. Run the setup script in production (if needed):
   ```bash
   vercel exec -- node setup-photographer.js
   ```

## Security Best Practices

1. **Never commit credentials**: Ensure `.env.local` and `.env.production` are in `.gitignore`
2. **Use strong passwords**: Generate secure passwords for photographer accounts
3. **Rotate credentials**: Regularly update passwords and secrets
4. **Environment separation**: Use different credentials for development, staging, and production

## Script Behavior

- **User exists**: Updates password and ensures photographer profile exists
- **User doesn't exist**: Creates new user and photographer profile
- **Photographer profile missing**: Creates the profile with approved status
- **Photographer profile exists**: Updates status to approved

## Troubleshooting

### Missing Environment Variables

If you see this error:
```
❌ Missing required environment variables:
PHOTOGRAPHER_EMAIL and PHOTOGRAPHER_PASSWORD must be set
```

Ensure you have set the required environment variables in your `.env.local` file or Vercel dashboard.

### Database Connection Issues

Ensure your `DATABASE_URL` is correctly set and the database is accessible.

### Prisma Schema Errors

If you encounter schema-related errors, ensure your database schema is up to date:
```bash
npx prisma db push
```

## Example Configuration

```env
# Required
PHOTOGRAPHER_EMAIL="john.doe@photography.com"
PHOTOGRAPHER_PASSWORD="SecurePass123!"

# Optional but recommended
PHOTOGRAPHER_NAME="John Doe"
PHOTOGRAPHER_BUSINESS_NAME="Doe Photography Studio"
PHOTOGRAPHER_PHONE="+1-555-123-4567"
PHOTOGRAPHER_WEBSITE="https://doephotography.com"
PHOTOGRAPHER_PORTFOLIO="https://portfolio.doephotography.com"
PHOTOGRAPHER_EXPERIENCE="Professional"
PHOTOGRAPHER_BIO="Award-winning photographer specializing in wedding and portrait photography with over 10 years of experience."
```

## Integration with CI/CD

For automated deployments, you can run the setup script as part of your deployment process:

```yaml
# Example GitHub Actions step
- name: Setup Photographer Account
  run: node setup-photographer.js
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
    PHOTOGRAPHER_EMAIL: ${{ secrets.PHOTOGRAPHER_EMAIL }}
    PHOTOGRAPHER_PASSWORD: ${{ secrets.PHOTOGRAPHER_PASSWORD }}
    # ... other variables
```

## Notes

- The script is idempotent - safe to run multiple times
- All photographer accounts are created with "approved" status
- Passwords are automatically hashed using bcrypt with 12 rounds
- The script will update existing accounts if they already exist