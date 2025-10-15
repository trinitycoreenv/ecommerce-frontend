# API Documentation

## Authentication Endpoints

### POST /api/auth/login
Login with email and password.

**Request Body:**
```json
{
  "email": "admin@ecommerce.com",
  "password": "admin123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "admin@ecommerce.com",
      "name": "Admin User",
      "role": "ADMIN"
    },
    "token": "jwt-token"
  }
}
```

### POST /api/auth/register
Register a new user account.

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "password": "password123",
  "name": "New User",
  "role": "CUSTOMER",
  "businessName": "Optional for vendors",
  "businessAddress": "Optional for vendors",
  "taxId": "Optional for vendors"
}
```

### POST /api/auth/logout
Logout and invalidate session.

**Headers:** `Authorization: Bearer <token>`

## Product Management

### GET /api/products
List products with optional filtering.

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10)
- `status` (string): Product status filter
- `categoryId` (string): Category filter
- `vendorId` (string): Vendor filter

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Product Name",
      "description": "Product description",
      "price": 99.99,
      "status": "APPROVED",
      "vendor": {
        "businessName": "Vendor Name"
      },
      "category": {
        "name": "Category Name"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

### POST /api/products
Create a new product (VENDOR role required).

**Request Body:**
```json
{
  "name": "Product Name",
  "description": "Product description",
  "price": 99.99,
  "categoryId": "category-uuid",
  "sku": "PRODUCT-001",
  "inventory": 100,
  "images": ["image1.jpg", "image2.jpg"],
  "metadata": {
    "weight": "1.5kg",
    "dimensions": "10x10x5cm"
  }
}
```

### GET /api/products/[id]
Get product details by ID.

### PUT /api/products/[id]
Update product (VENDOR role required).

### DELETE /api/products/[id]
Delete or discontinue product (VENDOR role required).

## Subscription Management

### GET /api/subscriptions
List subscriptions with optional filtering.

**Query Parameters:**
- `vendorId` (string): Filter by vendor
- `status` (string): Filter by status
- `page` (number): Page number
- `limit` (number): Items per page

### POST /api/subscriptions
Create a new subscription.

**Request Body:**
```json
{
  "vendorId": "vendor-uuid",
  "tier": "PREMIUM",
  "startDate": "2024-01-01T00:00:00Z",
  "endDate": "2024-12-31T23:59:59Z"
}
```

### GET /api/subscriptions/[id]
Get subscription details.

### PUT /api/subscriptions/[id]
Update subscription (cancel, suspend, reactivate, upgrade).

**Request Body:**
```json
{
  "action": "upgrade",
  "tier": "ENTERPRISE"
}
```

**Available Actions:**
- `cancel` - Cancel subscription
- `suspend` - Suspend subscription
- `reactivate` - Reactivate suspended subscription
- `upgrade` - Upgrade to higher tier

## Payout Management

### GET /api/payouts
List payouts with optional filtering.

**Query Parameters:**
- `vendorId` (string): Filter by vendor
- `status` (string): Filter by status
- `page` (number): Page number
- `limit` (number): Items per page

### POST /api/payouts
Create a new payout (FINANCE role required).

**Request Body:**
```json
{
  "vendorId": "vendor-uuid",
  "amount": 1000.00,
  "scheduledDate": "2024-01-15T00:00:00Z",
  "paymentMethod": "bank_transfer"
}
```

### GET /api/payouts/[id]
Get payout details.

### POST /api/payouts/[id]
Process payout (FINANCE role required).

### DELETE /api/payouts/[id]
Cancel payout (FINANCE role required).

## Reports

### GET /api/reports
List generated reports (ADMIN role required).

**Query Parameters:**
- `type` (string): Filter by report type
- `page` (number): Page number
- `limit` (number): Items per page

### POST /api/reports
Generate a new report (FINANCE role required).

**Request Body:**
```json
{
  "type": "COMMISSION_REPORT",
  "title": "Monthly Commission Report",
  "filters": {
    "startDate": "2024-01-01T00:00:00Z",
    "endDate": "2024-01-31T23:59:59Z",
    "vendorId": "optional-vendor-uuid"
  }
}
```

**Available Report Types:**
- `SALES_SUMMARY` - Sales and revenue summary
- `COMMISSION_REPORT` - Commission breakdown
- `VENDOR_PERFORMANCE` - Vendor performance metrics
- `LOGISTICS_REPORT` - Shipping and logistics performance
- `FINANCIAL_SUMMARY` - Financial overview

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message",
  "statusCode": 400
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `500` - Internal Server Error

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Role-Based Access Control

### ADMIN
- Full access to all endpoints
- Can manage all resources
- Can generate all reports

### VENDOR
- Can manage their own products
- Can view their own orders and transactions
- Can view their own payouts
- Can manage their own subscriptions

### FINANCE_ANALYST
- Can manage payouts
- Can generate financial reports
- Can view transaction data

### OPERATIONS_MANAGER
- Can manage logistics and shipping
- Can view operational reports
- Can manage shipment tracking

### CUSTOMER
- Can place orders
- Can view their own order history
- Can view product catalog

## Rate Limiting

API endpoints are not currently rate-limited but should be implemented in production using middleware or external services.

## Pagination

List endpoints support pagination with the following parameters:
- `page` - Page number (1-based)
- `limit` - Items per page (default: 10, max: 100)

Pagination response includes:
- `page` - Current page
- `limit` - Items per page
- `total` - Total number of items
- `totalPages` - Total number of pages
- `hasMore` - Boolean indicating if more pages exist

## Filtering and Sorting

Most list endpoints support filtering via query parameters. Sorting is typically by creation date (newest first) but can be customized per endpoint.

## Data Validation

All input data is validated using TypeScript interfaces and Prisma schema constraints. Invalid data will return 400 Bad Request with validation error details.
