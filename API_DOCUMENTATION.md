# API Documentation

This document provides comprehensive documentation for all API endpoints in the E-Commerce Multi-Vendor Marketplace Platform.

## 📋 Table of Contents

- [Authentication](#authentication)
- [Products](#products)
- [Orders](#orders)
- [Payments](#payments)
- [Shipping](#shipping)
- [Vendors](#vendors)
- [Admin](#admin)
- [Finance](#finance)
- [Operations](#operations)
- [Categories](#categories)
- [Subscriptions](#subscriptions)

## 🔐 Authentication

All API routes (except public routes) require JWT authentication via the `Authorization` header:

```
Authorization: Bearer <jwt_token>
```

### Login

**Endpoint**: `POST /api/auth/login`

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response**:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "User Name",
    "role": "CUSTOMER"
  }
}
```

### Register Customer

**Endpoint**: `POST /api/auth/register`

**Request Body**:
```json
{
  "email": "customer@example.com",
  "password": "password123",
  "name": "Customer Name",
  "role": "CUSTOMER",
  "phone": "+1234567890",
  "address": "123 Main St, City, Country"
}
```

### Register Vendor

**Endpoint**: `POST /api/auth/register`

**Request Body**:
```json
{
  "email": "vendor@example.com",
  "password": "password123",
  "name": "Vendor Name",
  "role": "VENDOR",
  "businessName": "Business Name",
  "businessAddress": "Business Address",
  "businessType": "RETAIL",
  "taxId": "TAX123456",
  "phone": "+1234567890"
}
```

### Logout

**Endpoint**: `POST /api/auth/logout`

**Headers**: Requires authentication

**Response**:
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

## 📦 Products

### List Products

**Endpoint**: `GET /api/products`

**Query Parameters**:
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10)
- `status` (string): Filter by status (APPROVED, PENDING_APPROVAL, DRAFT, REJECTED)
- `categoryId` (string): Filter by category
- `search` (string): Search by name or description
- `vendorId` (string): Filter by vendor

**Response**:
```json
{
  "success": true,
  "data": {
    "products": [...],
    "total": 100,
    "page": 1,
    "totalPages": 10
  }
}
```

### Get Product Details

**Endpoint**: `GET /api/products/:id`

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "product_id",
    "name": "Product Name",
    "description": "Product description",
    "price": 99.99,
    "inventory": 50,
    "status": "APPROVED",
    "images": ["url1", "url2"],
    "vendor": {
      "id": "vendor_id",
      "businessName": "Vendor Name"
    },
    "category": {
      "id": "category_id",
      "name": "Category Name"
    }
  }
}
```

### Create Product (Vendor Only)

**Endpoint**: `POST /api/products`

**Headers**: Requires authentication (Vendor role)

**Request Body**:
```json
{
  "name": "Product Name",
  "description": "Product description",
  "price": 99.99,
  "inventory": 50,
  "categoryId": "category_id",
  "sku": "SKU123",
  "images": ["url1", "url2"]
}
```

### Update Product (Vendor Only)

**Endpoint**: `PUT /api/products/:id`

**Headers**: Requires authentication (Vendor role)

**Request Body**: Same as create product

### Delete Product (Vendor Only)

**Endpoint**: `DELETE /api/products/:id`

**Headers**: Requires authentication (Vendor role)

### Approve Product (Admin Only)

**Endpoint**: `POST /api/products/approve`

**Headers**: Requires authentication (Admin role)

**Request Body**:
```json
{
  "productId": "product_id",
  "status": "APPROVED"
}
```

## 🛒 Orders

### List Orders

**Endpoint**: `GET /api/orders`

**Headers**: Requires authentication

**Query Parameters**:
- `page` (number): Page number
- `limit` (number): Items per page
- `status` (string): Filter by status
- `vendorId` (string): Filter by vendor (Admin only)

**Response**:
```json
{
  "success": true,
  "data": {
    "orders": [...],
    "total": 50,
    "page": 1,
    "totalPages": 5
  }
}
```

### Get Order Details

**Endpoint**: `GET /api/orders/:id`

**Headers**: Requires authentication

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "order_id",
    "orderNumber": "ORD-12345",
    "status": "CONFIRMED",
    "totalPrice": 199.99,
    "shippingAddress": "...",
    "items": [...],
    "shipment": {...}
  }
}
```

### Create Order

**Endpoint**: `POST /api/orders/create`

**Headers**: Requires authentication (Customer role)

**Request Body**:
```json
{
  "items": [
    {
      "productId": "product_id",
      "quantity": 2
    }
  ],
  "shippingAddress": {
    "name": "Customer Name",
    "street1": "123 Main St",
    "city": "City",
    "state": "State",
    "zip": "12345",
    "country": "US",
    "phone": "+1234567890"
  },
  "shippingMethod": "STANDARD"
}
```

### Update Order Status (Vendor/Admin Only)

**Endpoint**: `PUT /api/orders/:id`

**Headers**: Requires authentication

**Request Body**:
```json
{
  "status": "PROCESSING"
}
```

## 💳 Payments

### Create Payment Intent

**Endpoint**: `POST /api/payments/create-intent`

**Headers**: Requires authentication

**Request Body**:
```json
{
  "orderId": "order_id",
  "amount": 199.99
}
```

**Response**:
```json
{
  "success": true,
  "clientSecret": "pi_xxx_secret_xxx"
}
```

### Confirm Payment

**Endpoint**: `POST /api/payments/confirm`

**Headers**: Requires authentication

**Request Body**:
```json
{
  "paymentIntentId": "pi_xxx",
  "orderId": "order_id"
}
```

## 📦 Shipping

### Get Shipping Rates

**Endpoint**: `POST /api/shipping/rates`

**Headers**: Requires authentication

**Request Body**:
```json
{
  "addressFrom": {
    "street1": "123 Vendor St",
    "city": "City",
    "state": "State",
    "zip": "12345",
    "country": "US"
  },
  "addressTo": {
    "street1": "456 Customer Ave",
    "city": "City",
    "state": "State",
    "zip": "67890",
    "country": "US"
  },
  "parcels": [
    {
      "length": "10",
      "width": "8",
      "height": "4",
      "weight": "2"
    }
  ]
}
```

**Response**:
```json
{
  "success": true,
  "rates": [
    {
      "provider": "USPS",
      "servicelevel": "usps_priority",
      "amount": "12.50",
      "currency": "USD",
      "estimated_days": 3
    }
  ]
}
```

### Track Shipment

**Endpoint**: `GET /api/shipping/track/:trackingNumber`

**Response**:
```json
{
  "success": true,
  "data": {
    "carrier": "USPS",
    "trackingNumber": "9400111899562537866000",
    "status": "IN_TRANSIT",
    "estimatedDelivery": "2025-01-15T00:00:00Z",
    "trackingEvents": [...]
  }
}
```

## 👤 Vendors

### List Vendors (Admin Only)

**Endpoint**: `GET /api/vendors`

**Headers**: Requires authentication (Admin role)

**Query Parameters**:
- `page` (number): Page number
- `limit` (number): Items per page
- `status` (string): Filter by status

### Get Vendor Details

**Endpoint**: `GET /api/vendors/:id`

**Headers**: Requires authentication

### Update Vendor

**Endpoint**: `PUT /api/vendors/:id`

**Headers**: Requires authentication

### Vendor Analytics

**Endpoint**: `GET /api/vendor/analytics`

**Headers**: Requires authentication (Vendor role)

**Response**:
```json
{
  "success": true,
  "data": {
    "revenue": 10000,
    "sales": 150,
    "customers": 75,
    "products": 25,
    "dailySales": [...],
    "topProducts": [...]
  }
}
```

### Vendor Wallet

**Endpoint**: `GET /api/vendor/wallet`

**Headers**: Requires authentication (Vendor role)

**Response**:
```json
{
  "success": true,
  "data": {
    "availableBalance": 5000,
    "totalEarnings": 10000,
    "totalPaidOut": 5000,
    "pendingPayouts": 1000
  }
}
```

## 👨‍💼 Admin

### Admin Dashboard

**Endpoint**: `GET /api/admin/dashboard`

**Headers**: Requires authentication (Admin or Finance role)

**Response**:
```json
{
  "success": true,
  "data": {
    "totalRevenue": 100000,
    "subscriptionRevenue": 50000,
    "commissionRevenue": 50000,
    "activeVendors": 100,
    "pendingApprovals": 10,
    "activeShipments": 50,
    "mrr": 50000,
    "arr": 600000
  }
}
```

## 💰 Finance

### Finance Dashboard

**Endpoint**: `GET /api/finance/dashboard`

**Headers**: Requires authentication (Finance role)

### List Commissions

**Endpoint**: `GET /api/finance/commissions`

**Headers**: Requires authentication (Finance role)

### Process Payout

**Endpoint**: `POST /api/finance/payouts`

**Headers**: Requires authentication (Finance role)

**Request Body**:
```json
{
  "vendorId": "vendor_id",
  "amount": 1000
}
```

## 🚚 Operations

### Operations Dashboard

**Endpoint**: `GET /api/operations/shipments`

**Headers**: Requires authentication (Operations role)

### List Shipments

**Endpoint**: `GET /api/shipments`

**Headers**: Requires authentication

**Query Parameters**:
- `status` (string): Filter by status
- `page` (number): Page number
- `limit` (number): Items per page

## 📂 Categories

### List Categories

**Endpoint**: `GET /api/categories`

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "category_id",
      "name": "Electronics",
      "description": "Electronic devices and gadgets",
      "imageUrl": "https://..."
    }
  ]
}
```

### Create Category (Admin Only)

**Endpoint**: `POST /api/categories`

**Headers**: Requires authentication (Admin role)

## 💎 Subscriptions

### List Subscription Plans

**Endpoint**: `GET /api/subscription-plans`

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "plan_id",
      "name": "Pro Plan",
      "tier": "PREMIUM",
      "price": 5000,
      "commissionRate": 8.0,
      "features": [...]
    }
  ]
}
```

### Create Subscription

**Endpoint**: `POST /api/subscriptions/create`

**Headers**: Requires authentication (Vendor role)

**Request Body**:
```json
{
  "planId": "plan_id"
}
```

## 🔔 Webhooks

### Stripe Webhook

**Endpoint**: `POST /api/webhooks/stripe`

**Headers**: `stripe-signature`

Handles Stripe webhook events for payment confirmations.

### Shippo Webhook

**Endpoint**: `POST /api/webhooks/shipping`

Handles Shippo webhook events for tracking updates.

## ⚠️ Error Responses

All endpoints return errors in this format:

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

**Common HTTP Status Codes**:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## 🔒 Rate Limiting

API rate limits (to be implemented):
- Authenticated requests: 1000 requests/hour
- Unauthenticated requests: 100 requests/hour

## 📝 Notes

- All timestamps are in ISO 8601 format
- All prices are in the platform's base currency (PHP)
- Pagination starts at page 1
- Default page size is 10 items

---

For more information, see the main [README.md](README.md) or [SETUP_GUIDE.md](SETUP_GUIDE.md).
