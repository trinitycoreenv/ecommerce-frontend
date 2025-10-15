import { UserRole, SubscriptionTier, ProductStatus, OrderStatus, TransactionStatus, PayoutStatus } from '@prisma/client'

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Authentication Types
export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  user: {
    id: string
    email: string
    name: string
    role: UserRole
    emailVerified: boolean
    createdAt?: string
    vendorId?: string
  }
  token: string
}

export interface RegisterRequest {
  email: string
  password: string
  name: string
  role: UserRole
  businessName?: string
  businessAddress?: string
  taxId?: string
  businessLicense?: string
  businessLicenseExpiry?: string
  website?: string
  businessDescription?: string
}

// Product Types
export interface CreateProductRequest {
  name: string
  description?: string
  price: number
  categoryId: string
  sku?: string
  inventory?: number
  images?: string[]
  metadata?: Record<string, any>
  weight?: number
  dimensions?: {
    length?: number
    width?: number
    height?: number
  }
  tags?: string[]
  isDigital?: boolean
  requiresShipping?: boolean
  lowStockThreshold?: number
  variants?: Array<{
    name: string
    sku?: string
    price?: number
    inventory: number
    attributes: Record<string, string>
    images?: string[]
    isActive?: boolean
  }>
}

export interface UpdateProductRequest extends Partial<CreateProductRequest> {
  id: string
}

// Order Types
export interface CreateOrderRequest {
  customerId: string
  items: {
    productId: string
    quantity: number
  }[]
  shippingAddress: {
    street: string
    city: string
    state: string
    zipCode: string
    country: string
  }
  billingAddress?: {
    street: string
    city: string
    state: string
    zipCode: string
    country: string
  }
  notes?: string
}

// Subscription Types
export interface CreateSubscriptionRequest {
  vendorId: string
  tier: SubscriptionTier
  startDate: Date
  endDate?: Date
}

// Commission Calculation Types
export interface CommissionCalculation {
  orderId: string
  vendorId: string
  grossAmount: number
  commissionRate: number
  commissionAmount: number
  netPayout: number
}

// Payout Types
export interface CreatePayoutRequest {
  vendorId: string
  amount: number
  scheduledDate: Date
  paymentMethod?: string
}

// Report Types
export interface SalesReport {
  period: {
    start: Date
    end: Date
  }
  totalSales: number
  totalCommissions: number
  totalPayouts: number
  orderCount: number
  vendorCount: number
}

export interface VendorPerformanceReport {
  vendorId: string
  vendorName: string
  totalSales: number
  totalOrders: number
  averageOrderValue: number
  commissionEarned: number
  fulfillmentRate: number
}

// Logistics Types
export interface LogisticsConfig {
  shippingZones: {
    name: string
    countries: string[]
    rates: {
      weight: number
      price: number
    }[]
  }[]
  carriers: {
    name: string
    code: string
    trackingUrl: string
    supportedZones: string[]
  }[]
  slaDefinitions: {
    zone: string
    standard: number // days
    express: number // days
    overnight: number // days
  }[]
}

// Middleware Types
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string
    email: string
    name: string
    role: UserRole
  }
}

// Error Types
export class AppError extends Error {
  public statusCode: number
  public isOperational: boolean

  constructor(message: string, statusCode: number = 500) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = true

    Error.captureStackTrace(this, this.constructor)
  }
}

// Utility Types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>
