# Complete Setup Guide

This guide will walk you through setting up the E-Commerce Multi-Vendor Marketplace Platform on your local machine from scratch.

## 📋 Prerequisites Installation

### 1. Install Node.js

**Windows**:
1. Download Node.js 18.x or higher from https://nodejs.org/
2. Run the installer
3. Verify installation:
   ```bash
   node --version
   npm --version
   ```

**macOS**:
```bash
# Using Homebrew
brew install node@18

# Verify installation
node --version
npm --version
```

**Linux (Ubuntu/Debian)**:
```bash
# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

### 2. Install PostgreSQL

**Windows**:
1. Download PostgreSQL from https://www.postgresql.org/download/windows/
2. Run the installer
3. Remember the password you set for the `postgres` user
4. Verify installation:
   ```bash
   psql --version
   ```

**macOS**:
```bash
# Using Homebrew
brew install postgresql@15
brew services start postgresql@15

# Verify installation
psql --version
```

**Linux (Ubuntu/Debian)**:
```bash
# Install PostgreSQL
sudo apt-get update
sudo apt-get install -y postgresql postgresql-contrib

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Verify installation
psql --version
```

### 3. Install pnpm (Package Manager)

```bash
# Install pnpm globally
npm install -g pnpm

# Verify installation
pnpm --version
```

### 4. Install Git (if not already installed)

**Windows**: Download from https://git-scm.com/download/win

**macOS**:
```bash
brew install git
```

**Linux**:
```bash
sudo apt-get install -y git
```

## 🗄️ Database Setup

### 1. Access PostgreSQL

**Windows**:
```bash
# Open Command Prompt or PowerShell
psql -U postgres
```

**macOS/Linux**:
```bash
# Switch to postgres user
sudo -u postgres psql
```

### 2. Create Database

```sql
-- Create the database
CREATE DATABASE ecommerce_db;

-- Verify database was created
\l

-- Exit psql
\q
```

### 3. Create Database User (Optional but Recommended)

```sql
-- Create a new user
CREATE USER ecommerce_user WITH PASSWORD 'your_secure_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE ecommerce_db TO ecommerce_user;

-- Exit
\q
```

## 📦 Project Setup

### 1. Clone the Repository

```bash
# Clone the repository
git clone https://github.com/dfqhqw33q/coretransanction3.git

# Navigate to project directory
cd coretransanction3
```

### 2. Install Dependencies

```bash
# Install all project dependencies
pnpm install
```

This will install all required packages including:
- Next.js 15
- React 19
- Prisma
- Stripe SDK
- Shippo SDK
- And many more...

### 3. Configure Environment Variables

```bash
# Copy the example environment file
cp env.example .env
```

Now edit the `.env` file with your actual values:

```bash
# Windows
notepad .env

# macOS
nano .env

# Linux
nano .env
```

**Minimum required configuration**:

```env
# Database - Update with your PostgreSQL credentials
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/ecommerce_db?schema=public"

# JWT Secret - Generate a random string
JWT_SECRET="your-super-secret-jwt-key-change-this"
JWT_EXPIRES_IN="7d"

# Application URLs
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_API_URL="/api"

# Stripe (Get test keys from Stripe Dashboard)
STRIPE_SECRET_KEY="sk_test_your_key"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_your_key"
STRIPE_WEBHOOK_SECRET="whsec_your_secret"

# Shippo (Get test key from Shippo Dashboard)
SHIPPO_API_KEY="shippo_test_your_key"

# SendGrid (Optional - for email notifications)
SENDGRID_API_KEY="SG.your_key"
FROM_EMAIL="noreply@yourdomain.com"
FROM_NAME="E-commerce Platform"
```

**Important**: If your PostgreSQL password contains special characters, you must URL-encode them:
- `@` → `%40`
- `#` → `%23`
- `$` → `%24`
- `%` → `%25`

Example: If password is `hello@2024`, use `hello%402024`

### 4. Set Up Stripe (Payment Processing)

1. **Create Stripe Account**:
   - Go to https://dashboard.stripe.com/register
   - Sign up for a free account

2. **Get Test API Keys**:
   - Go to https://dashboard.stripe.com/test/apikeys
   - Copy "Publishable key" (starts with `pk_test_`)
   - Copy "Secret key" (starts with `sk_test_`)
   - Add them to your `.env` file

3. **Set Up Webhook (Optional for local development)**:
   ```bash
   # Install Stripe CLI
   # Windows: Download from https://github.com/stripe/stripe-cli/releases
   # macOS: brew install stripe/stripe-cli/stripe
   # Linux: See https://stripe.com/docs/stripe-cli

   # Login to Stripe
   stripe login

   # Forward webhooks to local server
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   
   # Copy the webhook signing secret (starts with whsec_)
   # Add it to STRIPE_WEBHOOK_SECRET in .env
   ```

### 5. Set Up Shippo (Shipping Integration)

1. **Create Shippo Account**:
   - Go to https://goshippo.com/
   - Sign up for a free account

2. **Get Test API Key**:
   - Go to https://apps.goshippo.com/settings/api
   - Copy your "Test Token" (starts with `shippo_test_`)
   - Add it to `SHIPPO_API_KEY` in `.env`

3. **Set Up Webhook (Optional)**:
   ```bash
   # Install ngrok to expose local server
   # Download from https://ngrok.com/download
   
   # Run ngrok
   ngrok http 3000
   
   # Copy the HTTPS URL (e.g., https://abc123.ngrok-free.app)
   # Add to .env:
   SHIPPO_WEBHOOK_URL="https://abc123.ngrok-free.app/api/webhooks/shipping"
   ```

### 6. Set Up SendGrid (Email - Optional)

1. **Create SendGrid Account**:
   - Go to https://signup.sendgrid.com/
   - Sign up for free (100 emails/day)

2. **Get API Key**:
   - Go to https://app.sendgrid.com/settings/api_keys
   - Click "Create API Key"
   - Give it "Full Access"
   - Copy the API key
   - Add it to `SENDGRID_API_KEY` in `.env`

3. **Verify Sender Email**:
   - Go to https://app.sendgrid.com/settings/sender_auth
   - Verify your sender email address
   - Use this email in `FROM_EMAIL` in `.env`

## 🚀 Initialize the Application

### 1. Generate Prisma Client

```bash
pnpm db:generate
```

This generates the Prisma Client based on your schema.

### 2. Run Database Migrations

```bash
pnpm db:migrate
```

This will:
- Create all database tables
- Set up relationships
- Apply all migrations

If prompted, enter a name for the migration (e.g., "initial_setup")

### 3. Seed the Database

```bash
pnpm db:seed
```

This will create:
- 8 product categories (Electronics, Fashion, Home & Garden, etc.)
- Admin user: `admin@ecommerce.com` / `admin123`
- Finance Analyst: `finance@ecommerce.com` / `finance123`
- Operations Manager: `operations@ecommerce.com` / `ops123`
- 4 subscription plans (Starter, Basic, Pro, Enterprise)

### 4. Start the Development Server

```bash
pnpm dev
```

The application will start at http://localhost:3000

You should see:
```
▲ Next.js 15.x.x
- Local:        http://localhost:3000
- Ready in X.Xs
```

## ✅ Verify Installation

### 1. Access the Application

Open your browser and go to http://localhost:3000

You should see the homepage.

### 2. Test Admin Login

1. Go to http://localhost:3000/login
2. Login with:
   - Email: `admin@ecommerce.com`
   - Password: `admin123`
3. You should be redirected to the admin dashboard

### 3. Test Customer Registration

1. Go to http://localhost:3000/register/customer
2. Fill in the registration form
3. Create a customer account
4. You should be redirected to the shop

### 4. Test Vendor Registration

1. Go to http://localhost:3000/register/vendor
2. Fill in the vendor registration form
3. Create a vendor account
4. You should be redirected to the vendor dashboard

### 5. Test Database Connection

```bash
# Open Prisma Studio (Database GUI)
pnpm db:studio
```

This opens a web interface at http://localhost:5555 where you can view and edit database records.

## 🔧 Common Issues & Solutions

### Issue: "Can't reach database server"

**Solution**:
1. Verify PostgreSQL is running:
   ```bash
   # Windows
   services.msc  # Look for PostgreSQL service
   
   # macOS
   brew services list
   
   # Linux
   sudo systemctl status postgresql
   ```

2. Check DATABASE_URL in `.env` is correct
3. Verify password is URL-encoded if it contains special characters

### Issue: "Port 3000 is already in use"

**Solution**:
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:3000 | xargs kill -9

# Or use a different port
PORT=3001 pnpm dev
```

### Issue: "Module not found" errors

**Solution**:
```bash
# Clear node_modules and reinstall
rm -rf node_modules
rm pnpm-lock.yaml
pnpm install
```

### Issue: Prisma Client errors

**Solution**:
```bash
# Regenerate Prisma Client
pnpm db:generate

# Restart development server
```

### Issue: Migration errors

**Solution**:
```bash
# Reset database (WARNING: deletes all data)
pnpm db:reset

# This will:
# 1. Drop the database
# 2. Create it again
# 3. Run all migrations
# 4. Run seed script
```

## 📚 Next Steps

Now that your development environment is set up:

1. **Explore the Application**:
   - Browse products as a customer
   - Create products as a vendor
   - Manage the platform as an admin

2. **Read the Documentation**:
   - Check `README.md` for feature overview
   - Review `DEPLOYMENT.md` for production deployment
   - See API documentation in the code

3. **Start Development**:
   - Make changes to the code
   - The development server will auto-reload
   - Check the browser console for errors

4. **Test Payment Flow**:
   - Use Stripe test cards (see `STRIPE_TEST_CARDS_COMPLETE.txt`)
   - Test card: `4242 4242 4242 4242`
   - Any future expiry date
   - Any 3-digit CVC

5. **Explore Database**:
   - Use Prisma Studio: `pnpm db:studio`
   - View tables, relationships, and data
   - Make manual changes if needed

## 🎓 Learning Resources

- **Next.js**: https://nextjs.org/docs
- **Prisma**: https://www.prisma.io/docs
- **Stripe**: https://stripe.com/docs
- **Shippo**: https://goshippo.com/docs
- **TypeScript**: https://www.typescriptlang.org/docs
- **Tailwind CSS**: https://tailwindcss.com/docs

## 💡 Tips

1. **Keep dependencies updated**:
   ```bash
   pnpm update
   ```

2. **Check for security issues**:
   ```bash
   pnpm audit
   ```

3. **Format code**:
   ```bash
   pnpm lint
   ```

4. **View logs**:
   - Check terminal for server logs
   - Check browser console for client logs
   - Check Prisma Studio for database state

5. **Backup database**:
   ```bash
   pg_dump -U postgres ecommerce_db > backup.sql
   ```

---

**Congratulations!** 🎉 Your development environment is now set up and ready for development!

If you encounter any issues not covered in this guide, please check the main README.md or create an issue on GitHub.
