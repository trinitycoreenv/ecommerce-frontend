# Deployment Guide

This guide provides detailed instructions for deploying the E-Commerce Multi-Vendor Marketplace Platform to production.

## 📋 Pre-Deployment Checklist

Before deploying to production, ensure you have:

- [ ] A production PostgreSQL database
- [ ] Stripe account with live API keys
- [ ] Shippo account with production API key
- [ ] SendGrid account with production API key (optional)
- [ ] Domain name configured
- [ ] SSL certificate (usually provided by hosting platform)

## 🔐 Environment Variables for Production

### 1. Generate Secure Secrets

```bash
# Generate JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate NEXTAUTH_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. Required Production Environment Variables

```env
# Database - Use production PostgreSQL connection string
DATABASE_URL="postgresql://user:password@production-db-host:5432/ecommerce_db?schema=public"

# JWT Configuration - Use generated secrets
JWT_SECRET="<generated-secret-from-step-1>"
JWT_EXPIRES_IN="7d"

# Application URLs - Use your production domain
NEXTAUTH_URL="https://yourdomain.com"
NEXTAUTH_SECRET="<generated-secret-from-step-1>"
NEXT_PUBLIC_APP_URL="https://yourdomain.com"
NEXT_PUBLIC_API_URL="https://yourdomain.com/api"

# Stripe - Use LIVE keys (pk_live_... and sk_live_...)
STRIPE_SECRET_KEY="sk_live_your_live_secret_key"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_your_live_publishable_key"
STRIPE_WEBHOOK_SECRET="whsec_your_production_webhook_secret"

# Shippo - Use production API key
SHIPPO_API_KEY="shippo_live_your_production_api_key"
SHIPPO_WEBHOOK_URL="https://yourdomain.com/api/webhooks/shipping"

# SendGrid - Use production API key
SENDGRID_API_KEY="SG.your_production_api_key"
FROM_EMAIL="noreply@yourdomain.com"
FROM_NAME="Your Platform Name"

# Commission Rates
DEFAULT_COMMISSION_RATE="0.15"
BASIC_COMMISSION_RATE="0.12"
PREMIUM_COMMISSION_RATE="0.08"
ENTERPRISE_COMMISSION_RATE="0.05"

# Subscription Pricing
STARTER_SUBSCRIPTION_PRICE="0"
BASIC_SUBSCRIPTION_PRICE="2000"
PREMIUM_SUBSCRIPTION_PRICE="5000"
ENTERPRISE_SUBSCRIPTION_PRICE="10000"

# File Upload
MAX_FILE_SIZE="10485760"
UPLOAD_DIR="./public/uploads"
```

## 🚀 Deployment to Vercel (Recommended)

Vercel is the recommended platform for deploying Next.js applications.

### Prerequisites

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Create a Vercel account: https://vercel.com/signup

### Steps

1. **Login to Vercel**:
   ```bash
   vercel login
   ```

2. **Link your project**:
   ```bash
   vercel link
   ```

3. **Set up PostgreSQL database**:
   - Option A: Use Vercel Postgres
   - Option B: Use external provider (Railway, Supabase, AWS RDS, etc.)

4. **Configure environment variables**:
   ```bash
   # Add environment variables one by one
   vercel env add DATABASE_URL production
   vercel env add JWT_SECRET production
   vercel env add NEXTAUTH_SECRET production
   # ... add all other variables
   ```

   Or use Vercel Dashboard:
   - Go to your project settings
   - Navigate to "Environment Variables"
   - Add all required variables

5. **Deploy**:
   ```bash
   vercel --prod
   ```

6. **Run database migrations**:
   ```bash
   # After deployment, run migrations
   vercel env pull .env.production
   DATABASE_URL="<your-production-db-url>" npx prisma migrate deploy
   ```

7. **Set up webhooks**:
   - **Stripe**: https://dashboard.stripe.com/webhooks
     - Endpoint: `https://yourdomain.com/api/webhooks/stripe`
     - Events: `payment_intent.succeeded`, `payment_intent.payment_failed`
   
   - **Shippo**: https://apps.goshippo.com/settings/api
     - Endpoint: `https://yourdomain.com/api/webhooks/shipping`

## 🚂 Deployment to Railway

Railway provides PostgreSQL database and easy deployment.

### Steps

1. **Create Railway account**: https://railway.app/

2. **Create new project**:
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Connect your repository

3. **Add PostgreSQL**:
   - Click "New" → "Database" → "PostgreSQL"
   - Railway will automatically set `DATABASE_URL`

4. **Configure environment variables**:
   - Go to your service settings
   - Add all required environment variables

5. **Deploy**:
   - Railway automatically deploys on git push
   - Or click "Deploy" in the dashboard

6. **Run migrations**:
   ```bash
   # In Railway dashboard, open the service shell
   npx prisma migrate deploy
   npx prisma db seed
   ```

## 🎨 Deployment to Render

Render provides free PostgreSQL and web service hosting.

### Steps

1. **Create Render account**: https://render.com/

2. **Create PostgreSQL database**:
   - Dashboard → "New" → "PostgreSQL"
   - Copy the "Internal Database URL"

3. **Create Web Service**:
   - Dashboard → "New" → "Web Service"
   - Connect your GitHub repository
   - Configure:
     - **Build Command**: `pnpm install && pnpm db:generate && pnpm build`
     - **Start Command**: `pnpm start`

4. **Add environment variables**:
   - In web service settings, add all required variables
   - Use the PostgreSQL Internal Database URL for `DATABASE_URL`

5. **Deploy**:
   - Render automatically deploys on git push

6. **Run migrations**:
   - In Render dashboard, open Shell
   - Run: `npx prisma migrate deploy`

## ☁️ Deployment to AWS

### Prerequisites

- AWS account
- AWS CLI installed
- Basic knowledge of AWS services

### Services Required

1. **EC2** - Application server
2. **RDS** - PostgreSQL database
3. **S3** - File storage (optional)
4. **CloudFront** - CDN (optional)
5. **Route 53** - DNS management

### Steps

1. **Set up RDS PostgreSQL**:
   - Create RDS PostgreSQL instance
   - Note the connection string

2. **Set up EC2 instance**:
   - Launch Ubuntu 22.04 LTS instance
   - Configure security groups (allow ports 80, 443, 22)

3. **Install dependencies on EC2**:
   ```bash
   # SSH into EC2
   ssh -i your-key.pem ubuntu@your-ec2-ip

   # Install Node.js
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs

   # Install pnpm
   npm install -g pnpm

   # Install PostgreSQL client
   sudo apt-get install -y postgresql-client

   # Install PM2 for process management
   npm install -g pm2
   ```

4. **Clone and setup application**:
   ```bash
   git clone <your-repo-url>
   cd ecommerce
   pnpm install
   ```

5. **Configure environment variables**:
   ```bash
   nano .env
   # Add all production environment variables
   ```

6. **Run migrations**:
   ```bash
   pnpm db:migrate
   pnpm db:seed
   ```

7. **Build application**:
   ```bash
   pnpm build
   ```

8. **Start with PM2**:
   ```bash
   pm2 start npm --name "ecommerce" -- start
   pm2 save
   pm2 startup
   ```

9. **Set up Nginx reverse proxy**:
   ```bash
   sudo apt-get install -y nginx

   # Configure Nginx
   sudo nano /etc/nginx/sites-available/ecommerce
   ```

   Add configuration:
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

   Enable site:
   ```bash
   sudo ln -s /etc/nginx/sites-available/ecommerce /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

10. **Set up SSL with Let's Encrypt**:
    ```bash
    sudo apt-get install -y certbot python3-certbot-nginx
    sudo certbot --nginx -d yourdomain.com
    ```

## 🔄 Database Migration Strategy

### Development to Production

1. **Test migrations locally**:
   ```bash
   pnpm db:migrate
   ```

2. **Commit migration files**:
   ```bash
   git add prisma/migrations
   git commit -m "Add database migration"
   git push
   ```

3. **Deploy migrations to production**:
   ```bash
   # Using Prisma migrate deploy (recommended for production)
   DATABASE_URL="<production-url>" npx prisma migrate deploy
   ```

### Rolling Back Migrations

If you need to rollback:

```bash
# Reset to a specific migration
npx prisma migrate resolve --rolled-back <migration-name>

# Or reset entire database (WARNING: deletes all data)
npx prisma migrate reset
```

## 📊 Monitoring & Logging

### Recommended Tools

1. **Application Monitoring**:
   - Vercel Analytics (if using Vercel)
   - New Relic
   - Datadog
   - Sentry (for error tracking)

2. **Database Monitoring**:
   - Prisma Pulse
   - pgAdmin
   - DataGrip

3. **Logging**:
   - Logtail
   - Papertrail
   - CloudWatch (if using AWS)

### Set up Sentry for Error Tracking

1. Create Sentry account: https://sentry.io/

2. Install Sentry:
   ```bash
   pnpm add @sentry/nextjs
   ```

3. Configure Sentry:
   ```bash
   npx @sentry/wizard@latest -i nextjs
   ```

4. Add to environment variables:
   ```env
   NEXT_PUBLIC_SENTRY_DSN="your-sentry-dsn"
   ```

## 🔒 Security Best Practices

1. **Environment Variables**:
   - Never commit `.env` file
   - Use platform-specific secret management
   - Rotate secrets regularly

2. **Database**:
   - Use SSL connections
   - Restrict database access by IP
   - Regular backups
   - Use read replicas for scaling

3. **API Security**:
   - Rate limiting
   - CORS configuration
   - Input validation
   - SQL injection prevention (Prisma handles this)

4. **SSL/TLS**:
   - Always use HTTPS in production
   - Enable HSTS headers
   - Use strong cipher suites

5. **Dependencies**:
   - Regular security audits: `pnpm audit`
   - Keep dependencies updated
   - Use Dependabot or Renovate

## 🧪 Testing Before Deployment

1. **Run tests**:
   ```bash
   pnpm test
   ```

2. **Build locally**:
   ```bash
   pnpm build
   pnpm start
   ```

3. **Test production build**:
   - Test all user flows
   - Test payment processing
   - Test email notifications
   - Test webhook endpoints

## 📈 Performance Optimization

1. **Enable caching**:
   - Use Next.js ISR (Incremental Static Regeneration)
   - Cache API responses
   - Use CDN for static assets

2. **Database optimization**:
   - Add indexes to frequently queried fields
   - Use connection pooling
   - Optimize queries

3. **Image optimization**:
   - Use Next.js Image component
   - Compress images
   - Use WebP format

## 🆘 Troubleshooting Production Issues

### Application won't start

1. Check environment variables are set correctly
2. Verify database connection
3. Check build logs for errors
4. Ensure all dependencies are installed

### Database connection errors

1. Verify `DATABASE_URL` is correct
2. Check database is running and accessible
3. Verify SSL settings if required
4. Check firewall rules

### Webhook failures

1. Verify webhook URLs are correct
2. Check webhook secrets match
3. Test webhook endpoints manually
4. Check application logs

## 📞 Support

For deployment issues:

1. Check platform-specific documentation
2. Review application logs
3. Check database logs
4. Contact platform support

---

**Remember**: Always test thoroughly in a staging environment before deploying to production!
