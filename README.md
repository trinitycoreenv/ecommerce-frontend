# E-Commerce Multi-Vendor Marketplace Platform

A comprehensive multi-vendor e-commerce platform built with Next.js 15, TypeScript, PostgreSQL, and Prisma ORM. This system enables multiple vendors to sell products through a unified marketplace with automated commission tracking, order management, shipping integration, and financial operations.

## 🌟 Features

### Customer Features
- **Product Browsing & Search** - Browse products by category with search functionality
- **Shopping Cart** - Add products to cart with quantity management
- **Secure Checkout** - Multi-step checkout with shipping address and payment
- **Stripe Payment Integration** - Secure payment processing with Stripe
- **Real-time Shipping Rates** - Get shipping rates from multiple carriers via Shippo
- **Order Tracking** - Track orders with real-time shipment status updates
- **Order History** - View past orders and order details

### Vendor Features
- **Vendor Registration** - Self-service vendor registration with business details
- **Product Management** - Create, edit, and manage product listings
- **Inventory Tracking** - Real-time inventory management with low stock alerts
- **Order Management** - View and manage customer orders
- **Shipping Management** - Configure shipping zones and rates
- **Analytics Dashboard** - View sales, revenue, and performance metrics
- **Wallet & Earnings** - Track earnings, commissions, and available balance
- **Payout Management** - View payout history and pending payouts
- **Subscription Management** - Manage subscription tier and billing

### Admin Features
- **Admin Dashboard** - Platform-wide metrics and KPIs
- **Product Approval** - Approve or reject vendor product listings
- **Vendor Management** - Manage vendor accounts and verification status
- **Subscription Oversight** - Monitor vendor subscriptions and revenue
- **Commission Tracking** - Track platform commissions from all orders
- **Analytics & Reports** - Comprehensive platform analytics
- **User Management** - Manage all user accounts and roles
- **Category Management** - Create and manage product categories

### Finance Analyst Features
- **Finance Dashboard** - Revenue metrics and financial KPIs
- **Commission Management** - View and manage commission records
- **Payout Processing** - Process vendor payouts
- **Transaction Monitoring** - Monitor all platform transactions
- **Subscription Revenue** - Track MRR (Monthly Recurring Revenue) and ARR
- **Financial Reports** - Generate financial reports and exports

### Operations Manager Features
- **Operations Dashboard** - Logistics and shipment metrics
- **Shipment Monitoring** - Track all active shipments
- **SLA Compliance** - Monitor delivery SLA compliance
- **Carrier Performance** - Track carrier performance metrics
- **Logistics Analytics** - View logistics performance data

## 🛠️ Technology Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **Authentication**: JWT-based authentication with role-based access control (RBAC)
- **Payment Processing**: Stripe
- **Shipping Integration**: Shippo API
- **Email**: SendGrid
- **UI Components**: Radix UI, ShadCN UI
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Forms**: React Hook Form with Zod validation
- **Package Manager**: pnpm

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18.x or higher ([Download](https://nodejs.org/))
- **PostgreSQL** 15.x or higher ([Download](https://www.postgresql.org/download/))
- **pnpm** (recommended) or npm
  ```bash
  npm install -g pnpm
  ```

## 🚀 Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/dfqhqw33q/coretransanction3.git
cd coretransanction3
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Set Up PostgreSQL Database

Create a new PostgreSQL database:

```sql
CREATE DATABASE ecommerce_db;
```

Or using psql command line:

```bash
psql -U postgres
CREATE DATABASE ecommerce_db;
\q
```

### 4. Configure Environment Variables

Copy the example environment file:

```bash
cp env.example .env
```

Edit `.env` and configure the following required variables:

```env
# Database - Update with your PostgreSQL credentials
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/ecommerce_db?schema=public"

# JWT Configuration - Generate a secure random string
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRES_IN="7d"

# Application URLs
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_API_URL="/api"

# Stripe (Get from https://dashboard.stripe.com/test/apikeys)
STRIPE_SECRET_KEY="sk_test_your_stripe_secret_key"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_your_stripe_publishable_key"
STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret"

# Shippo (Get from https://goshippo.com/docs/intro/)
SHIPPO_API_KEY="shippo_test_your_shippo_api_key"

# SendGrid (Optional - Get from https://sendgrid.com/)
SENDGRID_API_KEY="your_sendgrid_api_key"
FROM_EMAIL="noreply@yourecommerce.com"
FROM_NAME="E-commerce Platform"
```

**Important Notes:**
- **Special characters in passwords** must be URL-encoded (e.g., `@` becomes `%40`)
- **Stripe Test Keys**: Use test mode keys for development
- **Shippo**: Use sandbox/test API key for development
- **SendGrid**: Optional for email notifications

### 5. Set Up Database Schema

Generate Prisma client and run migrations:

```bash
# Generate Prisma client
pnpm db:generate

# Run database migrations
pnpm db:migrate

# Seed the database with initial data
pnpm db:seed
```

The seed script will create:
- Product categories (Electronics, Fashion, Home & Garden, etc.)
- Admin user account
- Finance Analyst account
- Operations Manager account
- Subscription plans (Starter, Basic, Pro, Enterprise)

### 6. Run the Development Server

```bash
pnpm dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

## 👥 Default User Accounts

After running the seed script, you can log in with these accounts:

| Role | Email | Password | Access |
|------|-------|----------|--------|
| Admin | admin@ecommerce.com | admin123 | Full platform access |
| Finance Analyst | finance@ecommerce.com | finance123 | Financial operations |
| Operations Manager | operations@ecommerce.com | ops123 | Logistics & operations |

**Note**: Vendor and Customer accounts can be created through the registration pages.

## 📁 Project Structure

```
ecommerce/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   ├── auth/                 # Authentication endpoints
│   │   ├── products/             # Product management
│   │   ├── orders/               # Order management
│   │   ├── payments/             # Payment processing
│   │   ├── shipping/             # Shipping integration
│   │   ├── admin/                # Admin endpoints
│   │   ├── vendor/               # Vendor endpoints
│   │   ├── finance/              # Finance endpoints
│   │   ├── operations/           # Operations endpoints
│   │   └── webhooks/             # Webhook handlers
│   ├── admin/                    # Admin dashboard pages
│   ├── vendor/                   # Vendor dashboard pages
│   ├── finance/                  # Finance dashboard pages
│   ├── operations/               # Operations dashboard pages
│   ├── customer/                 # Customer pages
│   ├── shop/                     # Shopping pages
│   ├── login/                    # Login page
│   └── register/                 # Registration pages
├── components/                   # React components
│   ├── ui/                       # ShadCN UI components
│   ├── shared/                   # Shared components
│   └── layout/                   # Layout components
├── lib/                          # Utility libraries
│   ├── auth.ts                   # Authentication utilities
│   ├── prisma.ts                 # Prisma client
│   ├── middleware.ts             # API middleware
│   ├── payment-service.ts        # Stripe integration
│   ├── services/                 # Business logic services
│   └── clients/                  # External API clients
├── prisma/                       # Database
│   ├── schema.prisma             # Database schema
│   ├── migrations/               # Database migrations
│   └── seed.ts                   # Seed data
├── public/                       # Static assets
└── styles/                       # Global styles
```

## 🗄️ Database Schema

### Core Entities

- **User** - User accounts with role-based access (ADMIN, VENDOR, CUSTOMER, FINANCE_ANALYST, OPERATIONS_MANAGER)
- **Vendor** - Vendor business profiles
- **Category** - Product categories
- **Product** - Product listings with approval workflow
- **Order** - Customer orders
- **OrderItem** - Individual items in orders
- **Shipment** - Shipping and tracking information
- **Transaction** - Payment transactions
- **Commission** - Platform commission records
- **Payout** - Vendor payout records
- **Subscription** - Vendor subscription records
- **SubscriptionPlan** - Available subscription tiers
- **AuditLog** - System audit trail

## 🔐 User Roles & Permissions

| Role | Description | Access |
|------|-------------|--------|
| **ADMIN** | Platform administrator | Full system access, vendor management, product approval |
| **VENDOR** | Product seller | Product management, order fulfillment, analytics |
| **CUSTOMER** | Product buyer | Shopping, checkout, order tracking |
| **FINANCE_ANALYST** | Financial operations | Commission tracking, payout processing, financial reports |
| **OPERATIONS_MANAGER** | Logistics oversight | Shipment monitoring, SLA tracking, carrier performance |

## 💳 Payment Integration

The platform uses **Stripe** for payment processing:

1. **Test Mode**: Use Stripe test cards for development
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`
   - See `STRIPE_TEST_CARDS_COMPLETE.txt` for more test cards

2. **Webhook Setup**: Configure Stripe webhooks for payment confirmations
   ```
   Endpoint: https://your-domain.com/api/webhooks/stripe
   Events: payment_intent.succeeded, payment_intent.payment_failed
   ```

## 📦 Shipping Integration

The platform uses **Shippo** for shipping and logistics:

1. **Real-time Rates**: Get shipping rates from multiple carriers
2. **Label Generation**: Create shipping labels (implementation ready)
3. **Tracking**: Real-time shipment tracking
4. **Webhook Setup**: Configure Shippo webhooks for tracking updates
   ```
   Endpoint: https://your-domain.com/api/webhooks/shipping
   ```

## 📊 Subscription Tiers

| Tier | Price | Commission Rate | Max Products | Max Orders | Features |
|------|-------|----------------|--------------|------------|----------|
| **Starter** | Free | 15% | 10 | 25/month | Basic features |
| **Basic** | ₱2,000/mo | 12% | 50 | 100/month | Growing businesses |
| **Pro** | ₱5,000/mo | 8% | 200 | 500/month | 14-day free trial |
| **Enterprise** | ₱10,000/mo | 5% | Unlimited | Unlimited | Full features |

## 🛠️ Available Scripts

```bash
# Development
pnpm dev              # Start development server
pnpm dev:host         # Start dev server accessible on network

# Build & Production
pnpm build            # Build for production
pnpm start            # Start production server

# Database
pnpm db:generate      # Generate Prisma client
pnpm db:push          # Push schema changes to database
pnpm db:migrate       # Run database migrations
pnpm db:seed          # Seed database with initial data
pnpm db:studio        # Open Prisma Studio (database GUI)
pnpm db:reset         # Reset database (WARNING: deletes all data)

# Testing
pnpm test             # Run tests
pnpm lint             # Run ESLint
```

## 🚦 Getting Started Guide

### For Customers

1. **Register**: Go to `/register/customer` and create an account
2. **Browse Products**: Visit `/customer` or `/shop` to browse products
3. **Add to Cart**: Click on products and add them to your cart
4. **Checkout**: Go to `/shop/checkout` to complete your purchase
5. **Track Orders**: View your orders at `/shop/orders`

### For Vendors

1. **Register**: Go to `/register/vendor` and create a vendor account
2. **Dashboard**: Access your dashboard at `/vendor`
3. **Add Products**: Go to `/vendor/products` to create product listings
4. **Manage Orders**: View and fulfill orders at `/vendor/orders`
5. **Track Earnings**: Check your wallet and earnings at `/vendor/payouts`
6. **Manage Subscription**: Upgrade your plan at `/vendor/subscription`

### For Admins

1. **Login**: Use admin credentials at `/login`
2. **Dashboard**: Access admin dashboard at `/admin`
3. **Approve Products**: Review pending products at `/admin/product-approval`
4. **Manage Vendors**: View all vendors at `/admin/vendors`
5. **View Analytics**: Check platform analytics at `/admin/analytics`

## 🔧 Configuration

### Database Configuration

If you need to change database settings:

1. Update `DATABASE_URL` in `.env`
2. Run migrations: `pnpm db:migrate`
3. Restart the development server

### Email Configuration (Optional)

To enable email notifications:

1. Sign up for SendGrid: https://sendgrid.com/
2. Get your API key from SendGrid dashboard
3. Update `.env` with your SendGrid credentials:
   ```env
   SENDGRID_API_KEY="your_api_key"
   FROM_EMAIL="noreply@yourdomain.com"
   FROM_NAME="Your Platform Name"
   ```

### Stripe Configuration

1. Create a Stripe account: https://dashboard.stripe.com/register
2. Get your test API keys from: https://dashboard.stripe.com/test/apikeys
3. Update `.env` with your Stripe keys
4. For webhooks (optional in development):
   - Install Stripe CLI: https://stripe.com/docs/stripe-cli
   - Run: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
   - Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET`

### Shippo Configuration

1. Create a Shippo account: https://goshippo.com/
2. Get your test API key from: https://apps.goshippo.com/settings/api
3. Update `.env` with your Shippo API key
4. For webhooks (optional):
   - Use ngrok to expose your local server: `ngrok http 3000`
   - Update `SHIPPO_WEBHOOK_URL` in `.env` with your ngrok URL

## 🐛 Troubleshooting

### Database Connection Issues

**Problem**: `Error: Can't reach database server`

**Solution**:
1. Ensure PostgreSQL is running: `pg_ctl status` or check Services (Windows)
2. Verify database exists: `psql -U postgres -l`
3. Check DATABASE_URL in `.env` has correct credentials
4. URL-encode special characters in password (@ → %40, # → %23, etc.)

### Migration Errors

**Problem**: `Migration failed` or `Schema out of sync`

**Solution**:
```bash
# Reset database (WARNING: deletes all data)
pnpm db:reset

# Or manually:
pnpm db:generate
pnpm db:migrate
pnpm db:seed
```

### Port Already in Use

**Problem**: `Port 3000 is already in use`

**Solution**:
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:3000 | xargs kill -9

# Or use a different port
PORT=3001 pnpm dev
```

### Prisma Client Issues

**Problem**: `@prisma/client did not initialize yet`

**Solution**:
```bash
pnpm db:generate
# Restart your development server
```

### Stripe Payment Errors

**Problem**: Payments not processing

**Solution**:
1. Verify Stripe keys are correct in `.env`
2. Use test card numbers from Stripe documentation
3. Check browser console for errors
4. Ensure `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` starts with `pk_test_`

### Shippo Integration Issues

**Problem**: Shipping rates not loading

**Solution**:
1. Verify Shippo API key is correct
2. Check that you're using a test/sandbox key for development
3. Ensure shipping addresses are valid US addresses (Shippo test mode)

## 🌐 Deployment

### Environment Variables for Production

When deploying to production, ensure you:

1. **Generate secure secrets**:
   ```bash
   # Generate JWT_SECRET
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

   # Generate NEXTAUTH_SECRET
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. **Use production API keys**:
   - Stripe: Use live keys (starts with `pk_live_` and `sk_live_`)
   - Shippo: Use production API key
   - SendGrid: Use production API key

3. **Update URLs**:
   ```env
   NEXTAUTH_URL="https://yourdomain.com"
   NEXT_PUBLIC_APP_URL="https://yourdomain.com"
   NEXT_PUBLIC_API_URL="https://yourdomain.com/api"
   ```

4. **Set up webhooks**:
   - Stripe webhook: `https://yourdomain.com/api/webhooks/stripe`
   - Shippo webhook: `https://yourdomain.com/api/webhooks/shipping`

### Deployment Platforms

This application can be deployed to:

- **Vercel** (Recommended for Next.js)
  ```bash
  # Install Vercel CLI
  npm i -g vercel

  # Deploy
  vercel
  ```

- **Railway** (Includes PostgreSQL)
- **Render** (Includes PostgreSQL)
- **AWS** (EC2 + RDS)
- **DigitalOcean** (App Platform + Managed Database)

### Database Migration in Production

```bash
# Run migrations in production
pnpm db:migrate

# Or use Prisma migrate deploy (recommended for CI/CD)
npx prisma migrate deploy
```

## 📝 API Documentation

### Authentication

All API routes (except public routes) require JWT authentication.

**Login**:
```
POST /api/auth/login
Body: { email: string, password: string }
Response: { token: string, user: User }
```

**Register**:
```
POST /api/auth/register
Body: { email, password, name, role, ... }
Response: { token: string, user: User }
```

### Products

```
GET /api/products - List all products (with filters)
GET /api/products/:id - Get product details
POST /api/products - Create product (Vendor only)
PUT /api/products/:id - Update product (Vendor only)
DELETE /api/products/:id - Delete product (Vendor only)
```

### Orders

```
GET /api/orders - List orders (role-based filtering)
GET /api/orders/:id - Get order details
POST /api/orders/create - Create new order
PUT /api/orders/:id - Update order status
```

### Payments

```
POST /api/payments/create-intent - Create Stripe payment intent
POST /api/payments/confirm - Confirm payment
```

### Shipping

```
POST /api/shipping/rates - Get shipping rates
POST /api/shipping/labels - Create shipping label
GET /api/shipping/track/:trackingNumber - Track shipment
```

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- **Next.js** - React framework
- **Prisma** - Database ORM
- **Stripe** - Payment processing
- **Shippo** - Shipping integration
- **ShadCN UI** - UI components
- **Radix UI** - Headless UI components
- **Tailwind CSS** - Styling framework

## 📞 Support

For issues and questions:

1. Check the [Troubleshooting](#-troubleshooting) section
2. Search existing issues on GitHub
3. Create a new issue with detailed information

## 🗺️ Roadmap

Future enhancements planned:

- [ ] Multi-language support
- [ ] Advanced analytics and reporting
- [ ] Mobile app (React Native)
- [ ] Vendor messaging system
- [ ] Product reviews and ratings
- [ ] Wishlist functionality
- [ ] Advanced search and filters
- [ ] Inventory forecasting
- [ ] Automated marketing campaigns
- [ ] Multi-currency support

---

**Built with ❤️ using Next.js 15, TypeScript, and PostgreSQL**

