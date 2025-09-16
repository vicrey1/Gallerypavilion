# Deploying Gallery Pavilion to Vercel

This guide will walk you through deploying the Gallery Pavilion photography platform to Vercel, including both the React frontend and Node.js backend as serverless functions.

## Prerequisites

- [Vercel Account](https://vercel.com/signup)
- [GitHub Account](https://github.com) (repository already set up)
- [MongoDB Atlas Account](https://www.mongodb.com/cloud/atlas) (for database)
- [Vercel CLI](https://vercel.com/cli) (optional but recommended)

## Project Structure

The project is configured as a monorepo with the following structure:
```
Gallerypavilion/
├── frontend/          # React application
├── backend/           # Express.js API
├── api/              # Vercel serverless functions
├── vercel.json       # Vercel configuration
├── package.json      # Root package.json
└── .env.example      # Environment variables template
```

## Step 1: Prepare Your Database

### MongoDB Atlas Setup
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster (free tier is sufficient for testing)
3. Create a database user with read/write permissions
4. Whitelist your IP address (or use 0.0.0.0/0 for all IPs)
5. Get your connection string (it should look like: `mongodb+srv://username:password@cluster.mongodb.net/gallery-pavilion`)

## Step 2: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard (Recommended)

1. **Connect Repository**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your GitHub repository: `https://github.com/vicrey1/Gallerypavilion`

2. **Configure Build Settings**
   - Vercel will automatically detect the configuration from `vercel.json`
   - Root Directory: `./` (leave as default)
   - Build Command: `npm run build` (automatically configured)
   - Output Directory: `frontend/build` (automatically configured)

3. **Set Environment Variables**
   In the Vercel dashboard, go to your project settings and add these environment variables:
   
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/gallery-pavilion
   JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random
   JWT_EXPIRES_IN=7d
   NODE_ENV=production
   FRONTEND_URL=https://your-app-name.vercel.app
   BACKEND_URL=https://your-app-name.vercel.app/api
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
   ```

4. **Deploy**
   - Click "Deploy"
   - Vercel will build and deploy your application
   - You'll get a URL like `https://your-app-name.vercel.app`

### Option B: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy from Project Root**
   ```bash
   cd C:\Users\USER\Desktop\Gallerypavilion
   vercel
   ```

4. **Follow the prompts:**
   - Set up and deploy? `Y`
   - Which scope? Choose your account
   - Link to existing project? `N` (for first deployment)
   - Project name: `gallery-pavilion` or your preferred name
   - In which directory is your code located? `./`

5. **Set Environment Variables**
   ```bash
   vercel env add MONGODB_URI
   vercel env add JWT_SECRET
   vercel env add NODE_ENV
   # Add other variables as needed
   ```

## Step 3: Configure Environment Variables

### Required Environment Variables

| Variable | Description | Example |
|----------|-------------|----------|
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/gallery-pavilion` |
| `JWT_SECRET` | Secret key for JWT tokens | `your-super-secret-key-here` |
| `JWT_EXPIRES_IN` | JWT token expiration | `7d` |
| `NODE_ENV` | Environment mode | `production` |
| `FRONTEND_URL` | Your Vercel app URL | `https://your-app.vercel.app` |
| `BACKEND_URL` | API base URL | `https://your-app.vercel.app/api` |

### Optional Environment Variables

| Variable | Description | Default |
|----------|-------------|----------|
| `RATE_LIMIT_WINDOW_MS` | Rate limiting window | `900000` (15 min) |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | `100` |
| `ADMIN_EMAIL` | Default admin email | - |
| `ADMIN_PASSWORD` | Default admin password | - |

## Step 4: Verify Deployment

1. **Check Frontend**
   - Visit your Vercel URL
   - Verify the React app loads correctly
   - Check that routing works (try navigating to different pages)

2. **Check Backend API**
   - Test API endpoints: `https://your-app.vercel.app/api/health`
   - Verify database connection
   - Test authentication endpoints

3. **Check Logs**
   - Go to Vercel Dashboard → Your Project → Functions
   - Check function logs for any errors
   - Monitor performance and errors

## Step 5: Custom Domain (Optional)

1. **Add Custom Domain**
   - Go to Project Settings → Domains
   - Add your custom domain
   - Configure DNS records as instructed

2. **Update Environment Variables**
   - Update `FRONTEND_URL` and `BACKEND_URL` to use your custom domain
   - Redeploy if necessary

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check that all dependencies are listed in `package.json`
   - Verify Node.js version compatibility
   - Check build logs in Vercel dashboard

2. **API Not Working**
   - Verify environment variables are set correctly
   - Check function logs for errors
   - Ensure MongoDB connection string is correct

3. **Database Connection Issues**
   - Verify MongoDB Atlas IP whitelist
   - Check connection string format
   - Ensure database user has proper permissions

4. **CORS Issues**
   - Verify `FRONTEND_URL` environment variable
   - Check CORS configuration in backend

### Useful Commands

```bash
# Check deployment status
vercel ls

# View logs
vercel logs

# Redeploy
vercel --prod

# Remove deployment
vercel remove
```

## Performance Optimization

1. **Enable Caching**
   - Static assets are automatically cached by Vercel
   - Consider implementing API response caching

2. **Optimize Images**
   - Use Vercel's Image Optimization
   - Consider using a CDN for large images

3. **Monitor Performance**
   - Use Vercel Analytics
   - Monitor function execution times
   - Set up error tracking

## Security Considerations

1. **Environment Variables**
   - Never commit `.env` files to version control
   - Use strong, unique JWT secrets
   - Regularly rotate sensitive credentials

2. **Database Security**
   - Use MongoDB Atlas IP whitelisting
   - Enable database authentication
   - Regular security updates

3. **API Security**
   - Implement rate limiting (already configured)
   - Use HTTPS only (automatic with Vercel)
   - Validate all inputs

## Support

If you encounter issues:
1. Check [Vercel Documentation](https://vercel.com/docs)
2. Review function logs in Vercel dashboard
3. Check MongoDB Atlas connection status
4. Verify all environment variables are set correctly

---

**Your Gallery Pavilion app should now be live on Vercel! 🎉**

Access your deployed application at: `https://your-app-name.vercel.app`