# Complete User Roles Guide

## All 5 User Roles in the E-commerce Platform

The platform supports **5 distinct user roles** with different permissions and dashboard access:

### 1. **ADMIN** - Platform Administrator
- **Email**: admin@ecommerce.com
- **Password**: admin123
- **Access**: Full platform control
- **Dashboard**: `/admin`
- **Features**:
  - Subscription management
  - Catalogue oversight and approval
  - Logistics configuration
  - Transaction and payout oversight
  - Comprehensive reporting
  - User management

### 2. **VENDOR** - Product Seller
- **Email**: vendor1@example.com, vendor2@example.com, vendor3@example.com
- **Password**: vendor123
- **Access**: Product and order management
- **Dashboard**: `/vendor`
- **Features**:
  - Product catalog management (CRUD)
  - Order tracking and fulfillment
  - Payout monitoring
  - Sales analytics
  - Inventory management

### 3. **CUSTOMER** - End User/Shopper
- **Email**: customer1@example.com, customer2@example.com
- **Password**: customer123
- **Access**: Shopping and order management
- **Dashboard**: `/shop`
- **Features**:
  - Product browsing and search
  - Shopping cart management
  - Order placement and tracking
  - Order history
  - Account management

### 4. **FINANCE_ANALYST** - Financial Operations
- **Email**: finance@ecommerce.com
- **Password**: finance123
- **Access**: Financial reporting and payout management
- **Dashboard**: `/finance`
- **Features**:
  - Transaction monitoring
  - Commission analysis
  - Payout scheduling and processing
  - Financial reporting
  - Revenue analytics

### 5. **OPERATIONS_MANAGER** - Logistics and Operations
- **Email**: operations@ecommerce.com
- **Password**: ops123
- **Access**: Logistics and operational oversight
- **Dashboard**: `/operations`
- **Features**:
  - Logistics configuration
  - Shipment monitoring
  - SLA compliance tracking
  - Performance reporting
  - Carrier management

## Role-Based Access Control (RBAC)

### Navigation Access
Each role sees only the navigation items relevant to their permissions:

- **ADMIN**: Full navigation access to all sections
- **VENDOR**: Product management, orders, payouts
- **CUSTOMER**: Shop, cart, orders
- **FINANCE_ANALYST**: Financial transactions, commissions, payouts
- **OPERATIONS_MANAGER**: Logistics, shipments, performance

### API Permissions
The backend enforces role-based API access:

- **Product APIs**: VENDOR, ADMIN
- **Payout APIs**: FINANCE_ANALYST, ADMIN
- **Report APIs**: FINANCE_ANALYST, ADMIN
- **Subscription APIs**: VENDOR, ADMIN
- **Order APIs**: CUSTOMER, VENDOR, ADMIN

### Database Permissions
Each role has specific database access patterns:

- **ADMIN**: Full read/write access to all tables
- **VENDOR**: Access to own products, orders, payouts
- **CUSTOMER**: Access to own orders and profile
- **FINANCE_ANALYST**: Access to financial data and reports
- **OPERATIONS_MANAGER**: Access to logistics and shipment data

## Testing All Roles

### Quick Test Commands
```bash
# Test Admin Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ecommerce.com","password":"admin123"}'

# Test Vendor Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"vendor1@example.com","password":"vendor123"}'

# Test Customer Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"customer1@example.com","password":"customer123"}'

# Test Finance Analyst Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"finance@ecommerce.com","password":"finance123"}'

# Test Operations Manager Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"operations@ecommerce.com","password":"ops123"}'
```

### Frontend Testing
1. Visit: `http://localhost:3000/test-integration`
2. Use any of the 5 test accounts
3. Verify role-based navigation appears
4. Test role-specific functionality

## Role Hierarchy and Permissions

```
ADMIN (Highest)
├── Full platform access
├── Can manage all other roles
└── Override permissions

FINANCE_ANALYST
├── Financial operations
├── Payout management
└── Financial reporting

OPERATIONS_MANAGER
├── Logistics operations
├── Shipment monitoring
└── Performance tracking

VENDOR
├── Product management
├── Order fulfillment
└── Sales analytics

CUSTOMER (Lowest)
├── Shopping functionality
├── Order placement
└── Account management
```

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Role-based API Access**: Backend enforces permissions
- **Audit Logging**: All actions logged with user context
- **Session Management**: Automatic token refresh and logout
- **Data Isolation**: Users only see their own data (except ADMIN)

## Development Notes

- All role names are uppercase in the backend (ADMIN, VENDOR, etc.)
- Frontend role types match backend exactly
- Navigation is dynamically generated based on user role
- API client automatically includes authentication headers
- Error handling provides role-appropriate feedback

1. ADMIN - Platform Administrator
Email: admin@ecommerce.com
Password: admin123
Role: ADMIN
Access: Full platform control
Dashboard: /admin
2. VENDOR - Product Sellers
Email: vendor1@example.com (John Smith - TechGear Solutions)
Email: vendor2@example.com (Sarah Johnson - Fashion Forward)
Email: vendor3@example.com (Mike Wilson - Home Essentials)
Password: vendor123 (for all vendors)
Role: VENDOR
Access: Product and order management
Dashboard: /vendor
3. CUSTOMER - End Users/Shoppers
Email: customer1@example.com (Alice Brown)
Email: customer2@example.com (Bob Davis)
Password: customer123 (for all customers)
Role: CUSTOMER
Access: Shopping and order management
Dashboard: /shop
4. FINANCE_ANALYST - Financial Operations
Email: finance@ecommerce.com
Password: finance123
Role: FINANCE_ANALYST
Access: Financial reporting and payout management
Dashboard: /finance
5. OPERATIONS_MANAGER - Logistics and Operations
Email: operations@ecommerce.com
Password: ops123
Role: OPERATIONS_MANAGER
Access: Logistics and operational oversight
Dashboard: /operations