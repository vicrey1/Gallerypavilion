# Vercel Production Deployment Setup

This guide explains how to properly configure environment variables on Vercel for the Gallery Pavilion application.

## Required Environment Variables on Vercel

In your Vercel dashboard, go to your project settings and add these environment variables:

### Database Configuration
```
DATABASE_URL=postgres://b18c5395aa3d0e51e232aae86b24c9976bba35b92409ebc8e6dedb76ba7bb446:sk_TkoOAoJkvi-qA6wKd5ztC@db.prisma.io:5432/postgres?sslmode=require
POSTGRES_URL=postgres://b18c5395aa3d0e51e232aae86b24c9976bba35b92409ebc8e6dedb76ba7bb446:sk_TkoOAoJkvi-qA6wKd5ztC@db.prisma.io:5432/postgres?sslmode=require
PRISMA_DATABASE_URL=prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqd3RfaWQiOjEsInNlY3VyZV9rZXkiOiJza19Ua29PQW9Ka3ZpLXFBNndLZDV6dEMiLCJhcGlfa2V5IjoiMDFLNEE0MzhLS0hWR1AyN1haMFhNNDJEMjIiLCJ0ZW5hbnRfaWQiOiJiMThjNTM5NWFhM2QwZTUxZTIzMmFhZTg2YjI0Yzk5NzZiYmEzNWI5MjQwOWViYzhlNmRlZGI3NmJhN2JiNDQ2IiwiaW50ZXJuYWxfc2VjcmV0IjoiODZhMTUyNWEtZmQxNy00YzVkLWFjNmMtMTJmYmVkZDQ3ZWE0In0.kf7UFt3BAkX0kz23bkBNnGDBGlkNZkzubysr_uTViQg
```

### NextAuth Configuration
```
NEXTAUTH_SECRET=26f9190b3499f89797803257e86f4753cfc6ec6fc912992936695d38098d9089
NEXTAUTH_URL=https://www.gallerypavilion.com
NEXTAUTH_URL_INTERNAL=https://www.gallerypavilion.com
```

### Admin Credentials
```
ADMIN_EMAIL=admin@gallerypavilion.com
ADMIN_PASSWORD=admin123
ADMIN_RESET_KEY=admin123
```

## Important Notes

1. **NEXTAUTH_URL**: Must be set to your production domain (`https://www.gallerypavilion.com`)
2. **NEXTAUTH_SECRET**: Critical for JWT token encryption - must be the same across all deployments
3. **Environment Scope**: Set all variables for "Production", "Preview", and "Development" environments
4. **No NEXT_PUBLIC_ prefix**: These are server-side variables, don't add the NEXT_PUBLIC_ prefix

## Vercel-Specific Considerations

- Vercel automatically sets some environment variables, but you still need to explicitly set NEXTAUTH_URL
- The credentials provider callback error is often caused by mismatched URLs between development and production
- Make sure your domain redirects are properly configured in `vercel.json`

## Deployment Steps

1. Set all environment variables in Vercel dashboard
2. Ensure your GitHub repository is connected to Vercel
3. Push changes to trigger automatic deployment
4. Test authentication flows on the production site

## Troubleshooting

If you encounter "Callback for provider type credentials not supported" error:

1. Verify NEXTAUTH_URL matches your production domain exactly
2. Check that NEXTAUTH_SECRET is set and matches across environments
3. Ensure the pages configuration in `auth.ts` includes proper sign-in and error pages
4. Test that the credentials provider is properly configured

## Testing Production Authentication

After deployment, test these authentication flows:

1. **Photographer Login**: `/auth/photographer-login`
2. **Admin Login**: `/auth/admin-login`
3. **Invite Code Access**: `/auth/invite-login`

All should redirect properly and maintain session state.