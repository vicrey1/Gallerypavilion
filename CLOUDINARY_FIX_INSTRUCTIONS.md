# Cloudinary Configuration Fix Instructions

## 🚨 Issue Identified

The photo upload is failing with a **500 error** because the Cloudinary cloud name is incorrectly set to `"Root"` which is not a valid cloud name.

### Error Details
- **Error**: `Invalid cloud_name Root` (HTTP 401)
- **Cause**: The `CLOUDINARY_CLOUD_NAME` environment variable is set to an invalid value
- **Impact**: All photo uploads fail with 500 error

## 🔧 How to Fix

### Step 1: Find Your Correct Cloudinary Cloud Name

1. **Log in to your Cloudinary account** at https://console.cloudinary.com/
2. **Go to Dashboard** - Your cloud name is displayed prominently on the main dashboard
3. **Alternative**: Go to Settings → API Keys page to find all credentials

### Step 2: Update Environment Variables

You need to update the Cloudinary environment variables in Vercel:

```bash
# Remove the incorrect cloud name
npx vercel env rm CLOUDINARY_CLOUD_NAME

# Add the correct cloud name (replace 'your-actual-cloud-name' with your real cloud name)
npx vercel env add CLOUDINARY_CLOUD_NAME
# When prompted, enter your actual cloud name (NOT 'Root')

# Verify other Cloudinary credentials are correct
npx vercel env rm CLOUDINARY_API_KEY
npx vercel env add CLOUDINARY_API_KEY
# Enter your actual API key

npx vercel env rm CLOUDINARY_API_SECRET  
npx vercel env add CLOUDINARY_API_SECRET
# Enter your actual API secret
```

### Step 3: Update Local Environment Files

Update your local `.env` files with the correct values:

**backend/.env:**
```env
# Replace 'Root' with your actual cloud name
CLOUDINARY_CLOUD_NAME=your-actual-cloud-name
CLOUDINARY_API_KEY=your-actual-api-key
CLOUDINARY_API_SECRET=your-actual-api-secret
CLOUDINARY_FOLDER=gallery-pavilion
```

### Step 4: Redeploy to Production

```bash
npx vercel --prod
```

## 🔍 How to Find Your Cloudinary Credentials

### Method 1: Cloudinary Dashboard
1. Go to https://console.cloudinary.com/
2. Your **Cloud Name** is displayed on the main dashboard
3. Click on **Settings** (gear icon) → **API Keys**
4. Copy your **Cloud Name**, **API Key**, and **API Secret**

### Method 2: API Keys Page
1. In Cloudinary Console, go to **Settings** → **API Keys**
2. All three credentials are listed:
   - **Cloud Name**: Your unique identifier (NOT 'Root')
   - **API Key**: Public key for authentication
   - **API Secret**: Private key (keep secure)

## ✅ Verification Steps

After updating the credentials:

1. **Check environment variables**:
   ```bash
   npx vercel env ls
   ```

2. **Test the deployment**:
   ```bash
   node test-production-cloudinary.js
   ```

3. **Monitor production logs**:
   ```bash
   npx vercel logs [your-production-url]
   ```

## 🚨 Important Notes

- **Never use 'Root' as a cloud name** - it's not valid
- **Keep API Secret secure** - never expose it in client-side code
- **Cloud Name is public** - it appears in all Cloudinary URLs
- **Each Cloudinary account has a unique cloud name**

## 📋 Current Status

- ✅ Code fix applied (metadata → context)
- ❌ Environment variables need correction
- ⏳ Waiting for correct Cloudinary credentials
- ⏳ Production deployment pending

## 🔗 Helpful Links

- [Cloudinary Console](https://console.cloudinary.com/)
- [Find Cloudinary Credentials Guide](https://cloudinary.com/documentation/developer_onboarding_faq_find_credentials)
- [Cloudinary Setup Documentation](https://cloudinary.com/documentation/solution_overview)

---

**Next Action Required**: Update the Cloudinary environment variables with your actual credentials from your Cloudinary account dashboard.