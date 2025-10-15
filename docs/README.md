# E-Commerce Platform - Backend Implementation

A comprehensive e-commerce platform backend built with Next.js API routes, PostgreSQL, and Prisma ORM. This implementation focuses on Platform Control & Revenue Management with role-based access control.

## 🏗️ Architecture Overview

### Tech Stack
- **Framework**: Next.js 15 with API routes
- **Language**: TypeScript
- **Database**: PostgreSQL 15
- **ORM**: Prisma
- **Authentication**: JWT with role-based access control (RBAC)
- **Frontend**: Next.js with Tailwind CSS and shadcn/ui

### Core Modules
1. **Authentication & Authorization** - JWT-based login with RBAC
2. **Subscription & Commission Management** - Vendor tiers and commission calculation
3. **Product Catalogue & Policy Oversight** - Product CRUD with approval workflows
4. **Shipment & Logistics Configuration** - Shipping zones, carriers, SLA management
5. **Payout & Transaction Management** - Payment processing and commission handling
6. **Admin Dashboard & Reports** - Analytics and reporting system

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL 15+
- pnpm (recommended) or npm

### Installation

1. **Clone and install dependencies**
   ```bash
   git clone <repository-url>
   cd ecommerce
   pnpm install
   ```

2. **Set up environment variables**
   ```bash
   cp env.example .env
   ```
   
   Update `.env` with your database credentials:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/ecommerce_db?schema=public"
   JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
   ```

3. **Set up the database**
   ```bash
   # Generate Prisma client
   pnpm db:generate
   
   # Push schema to database
   pnpm db:push
   
   # Seed with sample data
   pnpm db:seed
   ```

4. **Start the development server**
   ```bash
   pnpm dev
   ```

The application will be available at `http://localhost:3000`

## 📊 Database Schema

### Core Entities

#### Users & Authentication
- **users** - User accounts with role-based access
- **vendors** - Vendor profiles linked to users
- **audit_logs** - System audit trail

#### Products & Catalog
- **categories** - Product categories with policy rules
- **products** - Product catalog with approval workflow
- **order_items** - Individual items in orders

#### Orders & Transactions
- **orders** - Customer orders
- **transactions** - Payment transactions with commission calculation
- **shipments** - Shipping and logistics tracking

#### Subscriptions & Payouts
- **subscriptions** - Vendor subscription tiers
- **payouts** - Vendor payout management
- **logistics_config** - Shipping configuration per vendor

#### Reporting
- **reports** - Generated reports and analytics

### User Roles
- **ADMIN** - Full system access
- **VENDOR** - Product and order management
- **CUSTOMER** - Shopping and order placement
- **FINANCE_ANALYST** - Financial reporting and payout management
- **OPERATIONS_MANAGER** - Logistics and operations oversight

## 🔐 Authentication

### JWT-Based Authentication
All API routes are protected with JWT tokens. Include the token in the Authorization header:

```bash
Authorization: Bearer <your-jwt-token>
```

### Role-Based Access Control
Different endpoints require different roles:

- **Admin routes**: `/api/admin/*` - ADMIN only
- **Vendor routes**: `/api/products/*`, `/api/vendor/*` - VENDOR, ADMIN
- **Finance routes**: `/api/payouts/*`, `/api/reports/*` - FINANCE_ANALYST, ADMIN
- **Operations routes**: `/api/logistics/*` - OPERATIONS_MANAGER, ADMIN

## 📡 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout

### Products
- `GET /api/products` - List products (with filtering)
- `POST /api/products` - Create product (VENDOR)
- `GET /api/products/[id]` - Get product details
- `PUT /api/products/[id]` - Update product
- `DELETE /api/products/[id]` - Delete product

### Subscriptions
- `GET /api/subscriptions` - List subscriptions
- `POST /api/subscriptions` - Create subscription
- `GET /api/subscriptions/[id]` - Get subscription details
- `PUT /api/subscriptions/[id]` - Update subscription (cancel, suspend, upgrade)

### Payouts
- `GET /api/payouts` - List payouts
- `POST /api/payouts` - Create payout (FINANCE)
- `GET /api/payouts/[id]` - Get payout details
- `POST /api/payouts/[id]` - Process payout (FINANCE)
- `DELETE /api/payouts/[id]` - Cancel payout (FINANCE)

### Reports
- `GET /api/reports` - List generated reports (ADMIN)
- `POST /api/reports` - Generate new report (FINANCE)

## 💰 Commission System

### Subscription Tiers & Rates
- **BASIC**: 10% commission rate
- **PREMIUM**: 8% commission rate  
- **ENTERPRISE**: 5% commission rate

### Commission Calculation
Commissions are automatically calculated based on:
1. Vendor's active subscription tier
2. Order total amount
3. Product category policies

```typescript
// Example commission calculation
const commission = await CommissionService.calculateCommission(
  orderId,
  vendorId,
  grossAmount
)
```

## 📦 Logistics & Shipping

### Shipping Configuration
Each vendor can configure:
- Shipping zones and rates
- Supported carriers
- SLA definitions (standard, express, overnight)
- Auto-fulfillment settings

### Shipment Tracking
- Real-time status updates
- SLA monitoring and alerts
- Carrier integration (FedEx, UPS, etc.)

## 📈 Reporting & Analytics

### Available Reports
- **Sales Summary** - Revenue, orders, vendor performance
- **Commission Report** - Commission breakdown by vendor
- **Vendor Performance** - Sales metrics and fulfillment rates
- **Logistics Report** - Shipping performance and SLA compliance
- **Financial Summary** - Revenue, commissions, payouts

### Report Generation
Reports can be generated on-demand with custom date ranges and filters:

```typescript
// Generate commission report
const report = await generateReport({
  type: 'COMMISSION_REPORT',
  filters: {
    startDate: '2024-01-01',
    endDate: '2024-01-31',
    vendorId: 'optional-vendor-id'
  }
})
```

## 🛠️ Development

### Database Commands
```bash
# Generate Prisma client after schema changes
pnpm db:generate

# Push schema changes to database
pnpm db:push

# Create and run migrations
pnpm db:migrate

# Seed database with sample data
pnpm db:seed

# Open Prisma Studio (database GUI)
pnpm db:studio

# Reset database (careful!)
pnpm db:reset
```

### Project Structure
```
├── app/
│   ├── api/                 # API routes
│   │   ├── auth/           # Authentication endpoints
│   │   ├── products/       # Product management
│   │   ├── subscriptions/  # Subscription management
│   │   ├── payouts/        # Payout management
│   │   └── reports/        # Reporting system
│   └── globals.css         # Global styles
├── lib/
│   ├── auth.ts            # Authentication utilities
│   ├── middleware.ts      # API middleware
│   ├── prisma.ts          # Prisma client
│   ├── types.ts           # TypeScript types
│   └── services/          # Business logic services
│       ├── commission.ts  # Commission calculations
│       ├── subscription.ts # Subscription management
│       └── payout.ts      # Payout processing
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── seed.ts           # Database seeding
└── components/           # React components (frontend)
```

## 🔒 Security Features

### Authentication Security
- JWT tokens with configurable expiration
- Password hashing with bcrypt (12 rounds)
- Role-based access control
- Audit logging for all actions

### Data Protection
- Input validation and sanitization
- SQL injection prevention via Prisma
- Environment variable protection
- Secure password requirements

### API Security
- Rate limiting (implement as needed)
- CORS configuration
- Request validation
- Error handling without information leakage

## 🧪 Testing

### Test Accounts (from seed data)
- **Admin**: admin@ecommerce.com / admin123
- **Finance**: finance@ecommerce.com / finance123
- **Operations**: operations@ecommerce.com / ops123
- **Vendor 1**: vendor1@example.com / vendor123
- **Vendor 2**: vendor2@example.com / vendor123
- **Vendor 3**: vendor3@example.com / vendor123
- **Customer 1**: customer1@example.com / customer123
- **Customer 2**: customer2@example.com / customer123

### API Testing
Use tools like Postman or curl to test endpoints:

```bash
# Login example
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ecommerce.com","password":"admin123"}'

# Get products (requires auth token)
curl -X GET http://localhost:3000/api/products \
  -H "Authorization: Bearer <your-jwt-token>"
```

## 🚀 Deployment

### Environment Setup
1. Set up PostgreSQL database
2. Configure environment variables
3. Run database migrations
4. Seed initial data

### Production Considerations
- Use strong JWT secrets
- Enable SSL/TLS
- Set up proper logging
- Configure rate limiting
- Set up monitoring and alerts
- Regular database backups

## 📝 API Documentation

### Response Format
All API responses follow a consistent format:

```typescript
// Success response
{
  "success": true,
  "data": { /* response data */ },
  "message": "Optional message"
}

// Error response
{
  "success": false,
  "error": "Error message",
  "statusCode": 400
}

// Paginated response
{
  "success": true,
  "data": [/* array of items */],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

### Error Handling
- **400** - Bad Request (validation errors)
- **401** - Unauthorized (invalid/missing token)
- **403** - Forbidden (insufficient permissions)
- **404** - Not Found
- **409** - Conflict (duplicate resources)
- **500** - Internal Server Error

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Check the API documentation
- Review the database schema
- Test with the provided sample data
- Check logs for error details

---

**Built with ❤️ using Next.js, TypeScript, PostgreSQL, and Prisma**
