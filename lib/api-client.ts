// API Client for E-commerce Platform
// Handles all communication between frontend and backend

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

export interface User {
  id: string
  email: string
  name: string
  role: string
  emailVerified?: boolean
  createdAt?: string
  vendorId?: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  user: User
  token: string
}

export interface Product {
  id: string
  name: string
  description?: string
  price: number
  sku?: string
  inventory: number
  status: string
  images: string[]
  metadata?: any
  weight?: number
  dimensions?: {
    length?: number
    width?: number
    height?: number
  }
  tags: string[]
  isDigital: boolean
  requiresShipping: boolean
  lowStockThreshold: number
  variants?: ProductVariant[]
  vendor: {
    businessName: string
  }
  category: {
    id: string
    name: string
  }
  createdAt: string
  updatedAt: string
}

export interface ProductVariant {
  id?: string
  name: string
  sku?: string
  price?: number
  inventory: number
  attributes: Record<string, string>
  images: string[]
  isActive: boolean
}

export interface Subscription {
  id: string
  tier: string
  startDate: string
  endDate?: string
  status: string
  price: number
  vendor: {
    businessName: string
    user: {
      name: string
      email: string
    }
  }
}

export interface Payout {
  id: string
  amount: number
  scheduledDate: string
  status: string
  paymentMethod?: string
  paymentId?: string
  processedAt?: string
  vendor: {
    businessName: string
    user: {
      name: string
      email: string
    }
  }
}

class ApiClient {
  private baseUrl: string
  private token: string | null = null

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || '/api'
    this.token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    }

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`)
      }

      return data
    } catch (error) {
      console.error('API request failed:', error)
      throw error
    }
  }

  // Authentication methods
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await this.request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    })

    if (response.success && response.data) {
      this.token = (response.data as any).token
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_token', (response.data as any).token)
        localStorage.setItem('user', JSON.stringify((response.data as any).user))
      }
    }

    return response.data as any
  }

  async logout(): Promise<void> {
    try {
      await this.request('/auth/logout', {
        method: 'POST',
      })
    } finally {
      this.token = null
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token')
        localStorage.removeItem('user')
      }
    }
  }

  async register(userData: {
    email: string
    password: string
    name: string
    role: string
    businessName?: string
    businessAddress?: string
    taxId?: string
    businessLicense?: string
    businessLicenseExpiry?: string
    website?: string
    businessDescription?: string
  }): Promise<LoginResponse> {
    const response = await this.request<{ 
      success: boolean; 
      data: LoginResponse
    }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    })

    if (response.success && response.data) {
      this.token = (response.data as any).token
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_token', (response.data as any).token)
        localStorage.setItem('user', JSON.stringify((response.data as any).user))
      }
    }

    return response.data as any
  }

  // Product methods
  async getProducts(params?: {
    page?: number
    limit?: number
    status?: string
    categoryId?: string
    vendorId?: string
    search?: string
  }): Promise<PaginatedResponse<Product>> {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString())
        }
      })
    }

    const endpoint = `/products${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
    const response = await this.request<{ success: boolean; data: Product[]; pagination: any }>(endpoint)
    return {
      data: response.data,
      pagination: response.pagination
    }
  }

  async getProduct(id: string): Promise<Product> {
    const response = await this.request<Product>(`/products/${id}`)
    return response.data as any
  }

  async createProduct(productData: {
    name: string
    description?: string
    price: number
    categoryId: string
    sku?: string
    inventory?: number
    images?: string[]
    metadata?: any
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
    variants?: ProductVariant[]
  }): Promise<Product> {
    const response = await this.request<Product>('/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    })
    return response.data as any
  }

  async updateProduct(id: string, productData: Partial<{
    name: string
    description: string
    price: number
    categoryId: string
    sku: string
    inventory: number
    images: string[]
    metadata: any
    weight: number
    dimensions: {
      length?: number
      width?: number
      height?: number
    }
    tags: string[]
    isDigital: boolean
    requiresShipping: boolean
    lowStockThreshold: number
    variants: ProductVariant[]
  }>): Promise<Product> {
    const response = await this.request<Product>(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(productData),
    })
    return response.data as any
  }

  async deleteProduct(id: string): Promise<void> {
    await this.request(`/products/${id}`, {
      method: 'DELETE',
    })
  }

  // Subscription methods
  async getSubscriptions(params?: {
    vendorId?: string
    status?: string
    page?: number
    limit?: number
  }): Promise<{ data: Subscription[] }> {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString())
        }
      })
    }

    const endpoint = `/subscriptions${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
    const response = await this.request<{ data: Subscription | null }>(endpoint)
    
    // Convert single subscription to array format for consistency
    const subscription = response.data
    return {
      data: subscription ? [subscription] : []
    }
  }

  async getSubscription(id: string): Promise<Subscription> {
    const response = await this.request<Subscription>(`/subscriptions/${id}`)
    return response.data as any
  }

  async createSubscription(subscriptionData: {
    vendorId: string
    tier: string
    startDate: string
    endDate?: string
  }): Promise<Subscription> {
    const response = await this.request<Subscription>('/subscriptions', {
      method: 'POST',
      body: JSON.stringify(subscriptionData),
    })
    return response.data as any
  }

  async updateSubscription(id: string, action: string, tier?: string): Promise<Subscription> {
    const response = await this.request<Subscription>(`/subscriptions/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ action, tier }),
    })
    return response.data as any
  }

  // Payout methods
  async getPayouts(params?: {
    vendorId?: string
    status?: string
    page?: number
    limit?: number
  }): Promise<PaginatedResponse<Payout>> {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString())
        }
      })
    }

    const endpoint = `/payouts${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
    const response = await this.request<PaginatedResponse<Payout>>(endpoint)
    return response.data as any
  }

  async getPayout(id: string): Promise<Payout> {
    const response = await this.request<Payout>(`/payouts/${id}`)
    return response.data as any
  }

  async createPayout(payoutData: {
    vendorId: string
    amount: number
    scheduledDate: string
    paymentMethod?: string
  }): Promise<Payout> {
    const response = await this.request<Payout>('/payouts', {
      method: 'POST',
      body: JSON.stringify(payoutData),
    })
    return response.data as any
  }

  async processPayout(id: string): Promise<Payout> {
    const response = await this.request<Payout>(`/payouts/${id}`, {
      method: 'POST',
    })
    return response.data as any
  }

  async cancelPayout(id: string): Promise<Payout> {
    const response = await this.request<Payout>(`/payouts/${id}`, {
      method: 'DELETE',
    })
    return response.data as any
  }

  // Report methods
  async getReports(params?: {
    type?: string
    page?: number
    limit?: number
  }): Promise<PaginatedResponse<any>> {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString())
        }
      })
    }

    const endpoint = `/reports${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
    const response = await this.request<PaginatedResponse<any>>(endpoint)
    return response.data as any
  }

  async generateReport(reportData: {
    type: string
    title: string
    filters?: any
  }): Promise<any> {
    const response = await this.request<any>('/reports', {
      method: 'POST',
      body: JSON.stringify(reportData),
    })
    return response.data as any
  }

  // Order methods
  async getOrders(params?: {
    status?: string
    vendorId?: string
    customerId?: string
    dateFrom?: string
    dateTo?: string
    page?: number
    limit?: number
  }): Promise<PaginatedResponse<any>> {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString())
        }
      })
    }

    const endpoint = `/orders${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
    const response = await this.request<PaginatedResponse<any>>(endpoint)
    return response.data as any
  }

  async createOrder(orderData: {
    items: Array<{
      productId: string
      quantity: number
      price: number
    }>
    shippingAddress: {
      street: string
      city: string
      state: string
      zipCode: string
      country: string
    }
    paymentMethod: string
  }): Promise<any> {
    const response = await this.request<any>('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    })
    return response.data as any
  }

  async getOrder(id: string): Promise<any> {
    const response = await this.request<any>(`/orders/${id}`)
    return response.data as any
  }

  async updateOrder(id: string, updateData: {
    status?: string
    trackingNumber?: string
    notes?: string
  }): Promise<any> {
    const response = await this.request<any>(`/orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    })
    return response.data as any
  }

  async cancelOrder(id: string, reason?: string): Promise<any> {
    const endpoint = reason ? `/orders/${id}?reason=${encodeURIComponent(reason)}` : `/orders/${id}`
    const response = await this.request<any>(endpoint, {
      method: 'DELETE',
    })
    return response.data as any
  }

  // Category methods
  async getCategories(params?: {
    isActive?: boolean
    parentId?: string
    search?: string
  }): Promise<any[]> {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString())
        }
      })
    }

    const endpoint = `/categories${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
    const response = await this.request<any[]>(endpoint)
    return response.data as any
  }

  async getCategoryTree(): Promise<any[]> {
    const response = await this.request<any[]>('/categories/tree')
    return response.data as any
  }

  async getCategory(id: string): Promise<any> {
    const response = await this.request<any>(`/categories/${id}`)
    return response.data as any
  }

  // User methods
  async getUsers(params?: {
    role?: string
    isActive?: boolean
    search?: string
    page?: number
    limit?: number
  }): Promise<PaginatedResponse<any>> {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString())
        }
      })
    }

    const endpoint = `/users${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
    const response = await this.request<PaginatedResponse<any>>(endpoint)
    return response.data as any
  }

  async getUser(id: string): Promise<any> {
    const response = await this.request<any>(`/users/${id}`)
    return response.data as any
  }

  async updateUser(id: string, updateData: {
    firstName?: string
    lastName?: string
    phone?: string
    address?: any
    isActive?: boolean
  }): Promise<any> {
    const response = await this.request<any>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    })
    return response.data as any
  }

  // Vendor methods
  async getVendors(params?: {
    isActive?: boolean
    businessType?: string
    search?: string
    page?: number
    limit?: number
  }): Promise<PaginatedResponse<any>> {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString())
        }
      })
    }

    const endpoint = `/vendors${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
    const response = await this.request<PaginatedResponse<any>>(endpoint)
    return response.data as any
  }

  async getVendor(id: string): Promise<any> {
    const response = await this.request<any>(`/vendors/${id}`)
    return response.data as any
  }

  // Shipment methods
  async getShipments(params?: {
    status?: string
    carrier?: string
    orderId?: string
    vendorId?: string
    customerId?: string
    dateFrom?: string
    dateTo?: string
    page?: number
    limit?: number
  }): Promise<PaginatedResponse<any>> {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString())
        }
      })
    }

    const endpoint = `/shipments${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
    const response = await this.request<PaginatedResponse<any>>(endpoint)
    return response.data as any
  }

  async trackShipment(trackingNumber: string): Promise<any> {
    const response = await this.request<any>(`/shipments/track/${trackingNumber}`)
    return response.data as any
  }

  // Transaction methods
  async getTransactions(params?: {
    status?: string
    type?: string
    vendorId?: string
    orderId?: string
    dateFrom?: string
    dateTo?: string
    page?: number
    limit?: number
  }): Promise<PaginatedResponse<any>> {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString())
        }
      })
    }

    const endpoint = `/transactions${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
    const response = await this.request<PaginatedResponse<any>>(endpoint)
    return response.data as any
  }

  async getTransaction(id: string): Promise<any> {
    const response = await this.request<any>(`/transactions/${id}`)
    return response.data as any
  }

  // Utility methods
  setToken(token: string) {
    this.token = token
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token)
    }
  }

  getToken(): string | null {
    return this.token
  }

  isAuthenticated(): boolean {
    return !!this.token
  }
}

// Create and export a singleton instance
export const apiClient = new ApiClient()
export default apiClient
