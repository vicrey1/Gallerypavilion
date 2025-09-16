# Gallery Pavilion - Production Deployment Guide

## Prerequisites

### System Requirements
- Node.js 16+ and npm
- MongoDB 4.4+ (local or cloud)
- Domain name with SSL certificate
- Email service (SMTP)
- Cloud storage (AWS S3 recommended)

### Required Services
1. **Database**: MongoDB Atlas or self-hosted MongoDB
2. **Email**: SMTP service (Gmail, SendGrid, etc.)
3. **Storage**: AWS S3 or Cloudflare R2 (optional, defaults to local)
4. **Hosting**: VPS, cloud platform, or dedicated server

## Pre-Deployment Checklist

✅ **Environment Configuration**
- Backend and frontend `.env.production` files configured
- All placeholder values replaced with actual credentials
- JWT secrets generated (use strong random strings)

✅ **Security Settings**
- CORS origins configured for your domain
- Helmet security headers enabled
- Rate limiting configured
- Strong admin credentials set

✅ **Database Setup**
- MongoDB connection string configured
- Database indexes are optimized
- Backup strategy in place

✅ **Build Process**
- Frontend builds successfully (`npm run build`)
- No critical build warnings or errors
- All dependencies installed

## Deployment Steps

### 1. Server Setup

```bash
# Clone repository
git clone <your-repo-url>
cd Gallerypavilion

# Install dependencies
cd backend && npm install
cd ../frontend && npm install
```

### 2. Environment Configuration

**Backend (.env.production):**
```env
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/gallery-pavilion

# Security
JWT_SECRET=your-super-secure-jwt-secret-here
JWT_REFRESH_SECRET=your-refresh-secret-here
CORS_ORIGIN=https://yourdomain.com

# Email
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=465
EMAIL_SERVER_SECURE=true
EMAIL_SERVER_USER=your-email@gmail.com
EMAIL_SERVER_PASSWORD=your-app-password

# AWS S3 (Optional)
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_BUCKET=your-bucket-name
AWS_REGION=us-east-1
```

**Frontend (.env.production):**
```env
REACT_APP_API_URL=https://api.yourdomain.com
REACT_APP_FRONTEND_URL=https://yourdomain.com
REACT_APP_ENVIRONMENT=production
```

### 3. Build Frontend

```bash
cd frontend
npm run build
```

### 4. Start Services

**Option A: PM2 (Recommended)**
```bash
# Install PM2
npm install -g pm2

# Start backend
cd backend
NODE_ENV=production pm2 start server.js --name "gallery-backend"

# Serve frontend (with nginx or serve)
npm install -g serve
cd ../frontend
pm2 start "serve -s build -p 3000" --name "gallery-frontend"
```

**Option B: Docker**
```bash
# Build and run with docker-compose
docker-compose -f docker-compose.prod.yml up -d
```

### 5. Nginx Configuration

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # File uploads (increase limits)
    client_max_body_size 50M;
}
```

## Post-Deployment

### 1. Verify Services
- [ ] Backend API responds at `/api/health`
- [ ] Frontend loads correctly
- [ ] Database connection established
- [ ] Email service working
- [ ] File uploads functional

### 2. Create Admin Account
```bash
# Access your server and run:
cd backend
node scripts/createAdmin.js
```

### 3. SSL Certificate
```bash
# Using Certbot (Let's Encrypt)
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### 4. Monitoring Setup
- Configure log rotation
- Set up monitoring (PM2 monitoring, New Relic, etc.)
- Configure automated backups

## Security Considerations

### Essential Security Measures
1. **Firewall**: Only allow necessary ports (80, 443, 22)
2. **SSH**: Disable password auth, use key-based authentication
3. **Updates**: Keep system and dependencies updated
4. **Backups**: Regular database and file backups
5. **Monitoring**: Log monitoring and alerting

### Application Security
- Rate limiting is enabled (100 requests/15min per IP)
- Helmet security headers configured
- CORS properly configured
- JWT tokens with expiration
- Input validation on all endpoints

## Troubleshooting

### Common Issues

**Build Failures:**
- Check Node.js version compatibility
- Clear npm cache: `npm cache clean --force`
- Delete node_modules and reinstall

**Database Connection:**
- Verify MongoDB URI format
- Check network connectivity
- Ensure IP whitelist includes server IP

**Email Not Working:**
- Verify SMTP credentials
- Check firewall blocking SMTP ports
- Test with development ethereal account first

**File Upload Issues:**
- Check disk space
- Verify upload directory permissions
- Test S3 credentials if using cloud storage

### Logs Location
- Backend logs: `backend/logs/app.log`
- PM2 logs: `~/.pm2/logs/`
- Nginx logs: `/var/log/nginx/`

## Maintenance

### Regular Tasks
- [ ] Monitor disk space
- [ ] Review application logs
- [ ] Update dependencies monthly
- [ ] Backup database weekly
- [ ] Monitor SSL certificate expiration

### Performance Optimization
- Enable gzip compression in Nginx
- Configure CDN for static assets
- Implement database query optimization
- Monitor and optimize image sizes

## Support

For deployment issues:
1. Check application logs
2. Verify environment configuration
3. Test individual components
4. Review this documentation

---

**Note**: Replace all placeholder values (yourdomain.com, credentials, etc.) with your actual production values before deployment.