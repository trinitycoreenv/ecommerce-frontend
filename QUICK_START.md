# Quick Start Guide

Get the E-Commerce Multi-Vendor Marketplace Platform running in 15 minutes!

## ⚡ Prerequisites

Before you start, make sure you have:

- ✅ **Node.js 18+** installed ([Download](https://nodejs.org/))
- ✅ **PostgreSQL 15+** installed and running ([Download](https://www.postgresql.org/download/))
- ✅ **pnpm** installed (`npm install -g pnpm`)
- ✅ **Git** installed ([Download](https://git-scm.com/))

## 🚀 5-Step Setup

### Step 1: Clone and Install (2 minutes)

```bash
# Clone the repository
git clone https://github.com/dfqhqw33q/coretransanction3.git
cd coretransanction3

# Install dependencies
pnpm install
```

### Step 2: Create Database (1 minute)

```bash
# Open PostgreSQL command line
psql -U postgres

# Create database
CREATE DATABASE ecommerce_db;

# Exit
\q
```

### Step 3: Configure Environment (2 minutes)

```bash
# Copy environment file
cp env.example .env
```

Edit `.env` and update these **required** fields:

```env
# Update with your PostgreSQL password
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/ecommerce_db?schema=public"

# Generate random strings for these
JWT_SECRET="your-random-secret-here"
NEXTAUTH_SECRET="your-random-secret-here"
```

**Note**: If your password has special characters, URL-encode them:
- `@` → `%40`
- `#` → `%23`
- Example: `pass@123` → `pass%40123`

### Step 4: Initialize Database (5 minutes)

```bash
# Generate Prisma client
pnpm db:generate

# Run migrations
pnpm db:migrate

# Seed database with initial data
pnpm db:seed
```

### Step 5: Start the Server (1 minute)

```bash
# Start development server
pnpm dev
```

Open http://localhost:3000 in your browser! 🎉

## 👥 Test Accounts

After seeding, you can login with:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@ecommerce.com | admin123 |
| Finance | finance@ecommerce.com | finance123 |
| Operations | operations@ecommerce.com | ops123 |

**Create your own accounts**:
- Customer: http://localhost:3000/register/customer
- Vendor: http://localhost:3000/register/vendor

## 🎯 What to Try First

### As a Customer:
1. Go to http://localhost:3000/customer
2. Browse products
3. Add items to cart
4. Go through checkout (use test card: `4242 4242 4242 4242`)

### As a Vendor:
1. Register at http://localhost:3000/register/vendor
2. Go to http://localhost:3000/vendor/products
3. Create a new product
4. View your dashboard

### As an Admin:
1. Login at http://localhost:3000/login
2. Go to http://localhost:3000/admin
3. View platform metrics
4. Approve vendor products

## 🔧 Optional: Set Up Payment & Shipping

### Stripe (for payments):

1. Sign up at https://dashboard.stripe.com/register
2. Get test keys from https://dashboard.stripe.com/test/apikeys
3. Add to `.env`:
   ```env
   STRIPE_SECRET_KEY="sk_test_..."
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
   ```

### Shippo (for shipping):

1. Sign up at https://goshippo.com/
2. Get test key from https://apps.goshippo.com/settings/api
3. Add to `.env`:
   ```env
   SHIPPO_API_KEY="shippo_test_..."
   ```

## 📊 Useful Commands

```bash
# View database in browser
pnpm db:studio

# Reset database (deletes all data!)
pnpm db:reset

# Run on different port
PORT=3001 pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start
```

## ❓ Troubleshooting

### Can't connect to database?

```bash
# Check if PostgreSQL is running
# Windows: Check Services
# Mac: brew services list
# Linux: sudo systemctl status postgresql

# Verify database exists
psql -U postgres -l
```

### Port 3000 already in use?

```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:3000 | xargs kill -9
```

### Prisma errors?

```bash
# Regenerate Prisma client
pnpm db:generate

# Restart dev server
```

## 📚 Next Steps

- **Full Setup Guide**: See `SETUP_GUIDE.md` for detailed instructions
- **Features Overview**: See `README.md` for all features
- **Deployment**: See `DEPLOYMENT.md` for production deployment
- **API Docs**: Check the code for API endpoint documentation

## 🆘 Need Help?

1. Check `SETUP_GUIDE.md` for detailed troubleshooting
2. Review error messages in terminal
3. Check browser console for frontend errors
4. Verify all environment variables are set correctly

---

**That's it!** You should now have a fully functional e-commerce platform running locally. Happy coding! 🚀
