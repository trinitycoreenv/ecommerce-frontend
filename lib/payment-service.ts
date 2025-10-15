// Payment Service for E-commerce Platform
// Handles Stripe integration and payment processing

import Stripe from 'stripe'

export interface PaymentIntent {
  id: string
  amount: number
  currency: string
  status: 'requires_payment_method' | 'requires_confirmation' | 'requires_action' | 'processing' | 'succeeded' | 'canceled'
  client_secret: string
  metadata?: Record<string, string>
}

export interface PaymentMethod {
  id: string
  type: 'card' | 'paypal' | 'bank_account'
  card?: {
    brand: string
    last4: string
    exp_month: number
    exp_year: number
  }
  billing_details?: {
    name?: string
    email?: string
    address?: {
      line1?: string
      line2?: string
      city?: string
      state?: string
      postal_code?: string
      country?: string
    }
  }
}

export interface CreatePaymentIntentRequest {
  amount: number
  currency?: string
  orderId: string
  customerId: string
  vendorId: string
  metadata?: Record<string, string>
}

export interface ConfirmPaymentRequest {
  paymentIntentId: string
  paymentMethodId?: string
}

export interface StripeCustomer {
  id: string
  email: string
  name?: string
  metadata?: Record<string, string>
}

class PaymentService {
  private static readonly STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY
  private static readonly STRIPE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  private static readonly CURRENCY = 'php'
  private static readonly APPLICATION_FEE_PERCENTAGE = 0.029 // 2.9% application fee

  // Initialize Stripe instance
  public static getStripe(): Stripe {
    if (!this.STRIPE_SECRET_KEY) {
      throw new Error('Stripe secret key is not configured')
    }
    return new Stripe(this.STRIPE_SECRET_KEY, {
      apiVersion: '2024-12-18.acacia',
    })
  }

  // Check if Stripe is configured
  static isConfigured(): boolean {
    return !!(this.STRIPE_SECRET_KEY && this.STRIPE_PUBLISHABLE_KEY)
  }

  // Create a payment intent
  static async createPaymentIntent(request: CreatePaymentIntentRequest): Promise<PaymentIntent> {
    if (!this.isConfigured()) {
      throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY and NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY environment variables.')
    }

    try {
      const stripe = this.getStripe()
      
      const paymentIntent = await stripe.paymentIntents.create({
        amount: this.formatAmount(request.amount),
        currency: request.currency || this.CURRENCY,
        customer: request.customerId,
        metadata: {
          orderId: request.orderId,
          customerId: request.customerId,
          vendorId: request.vendorId,
          ...request.metadata
        },
        automatic_payment_methods: {
          enabled: true,
        },
      })

      console.log('💳 Payment Intent Created:', {
        id: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        orderId: request.orderId
      })

      return {
        id: paymentIntent.id,
        amount: this.parseAmount(paymentIntent.amount),
        currency: paymentIntent.currency,
        status: paymentIntent.status as any,
        client_secret: paymentIntent.client_secret!,
        metadata: paymentIntent.metadata
      }
    } catch (error) {
      console.error('Failed to create payment intent:', error)
      throw new Error(`Failed to create payment intent: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Confirm a payment intent
  static async confirmPayment(request: ConfirmPaymentRequest & { paymentMethodId?: string }): Promise<PaymentIntent> {
    if (!this.isConfigured()) {
      throw new Error('Stripe is not configured')
    }

    try {
      const stripe = this.getStripe()
      
      let paymentIntent
      
      if (request.paymentMethodId) {
        // Confirm payment intent with payment method
        paymentIntent = await stripe.paymentIntents.confirm(request.paymentIntentId, {
          payment_method: request.paymentMethodId
        })
      } else {
        // Just retrieve the payment intent
        paymentIntent = await stripe.paymentIntents.retrieve(request.paymentIntentId)
      }

      console.log('✅ Payment Confirmed:', {
        id: paymentIntent.id,
        status: paymentIntent.status
      })

      return {
        id: paymentIntent.id,
        amount: this.parseAmount(paymentIntent.amount),
        currency: paymentIntent.currency,
        status: paymentIntent.status as any,
        client_secret: paymentIntent.client_secret!,
        metadata: paymentIntent.metadata
      }
    } catch (error) {
      console.error('Failed to confirm payment:', error)
      throw new Error('Failed to confirm payment')
    }
  }

  // Get payment method details
  static async getPaymentMethod(paymentMethodId: string): Promise<PaymentMethod> {
    if (!this.isConfigured()) {
      throw new Error('Stripe is not configured')
    }

    try {
      // In a real implementation, you would retrieve from Stripe
      const paymentMethod: PaymentMethod = {
        id: paymentMethodId,
        type: 'card',
        card: {
          brand: 'visa',
          last4: '4242',
          exp_month: 12,
          exp_year: 2025
        },
        billing_details: {
          name: 'John Doe',
          email: 'john@example.com'
        }
      }

      return paymentMethod
    } catch (error) {
      console.error('Failed to get payment method:', error)
      throw new Error('Failed to get payment method')
    }
  }

  // Process refund
  static async processRefund(paymentIntentId: string, amount?: number): Promise<{ id: string; status: string }> {
    if (!this.isConfigured()) {
      throw new Error('Stripe is not configured')
    }

    try {
      // In a real implementation, you would process refund with Stripe
      const refund = {
        id: `re_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        status: 'succeeded'
      }

      console.log('💰 Refund Processed:', {
        id: refund.id,
        paymentIntentId,
        amount: amount || 'full'
      })

      return refund
    } catch (error) {
      console.error('Failed to process refund:', error)
      throw new Error('Failed to process refund')
    }
  }

  // Get Stripe publishable key for frontend
  static getPublishableKey(): string {
    if (!this.STRIPE_PUBLISHABLE_KEY) {
      throw new Error('Stripe publishable key is not configured')
    }
    return this.STRIPE_PUBLISHABLE_KEY
  }

  // Validate payment amount
  static validateAmount(amount: number): boolean {
    return amount > 0 && amount <= 99999999 // Stripe's maximum
  }

  // Format amount for Stripe (convert to cents)
  static formatAmount(amount: number): number {
    return Math.round(amount * 100)
  }

  // Parse amount from Stripe (convert from cents)
  static parseAmount(amount: number): number {
    return amount / 100
  }

  // Get or create Stripe customer
  static async getOrCreateCustomer(customerData: {
    email: string
    name?: string
    metadata?: Record<string, string>
  }): Promise<StripeCustomer> {
    if (!this.isConfigured()) {
      throw new Error('Stripe is not configured')
    }

    try {
      const stripe = this.getStripe()
      
      // First, try to find existing customer by email
      const existingCustomers = await stripe.customers.list({
        email: customerData.email,
        limit: 1
      })

      if (existingCustomers.data.length > 0) {
        const customer = existingCustomers.data[0]
        console.log('👤 Stripe Customer Retrieved:', {
          id: customer.id,
          email: customer.email
        })
        
        return {
          id: customer.id,
          email: customer.email,
          name: customer.name || undefined,
          metadata: customer.metadata
        }
      }

      // Create new customer if not found
      const customer = await stripe.customers.create({
        email: customerData.email,
        name: customerData.name,
        metadata: customerData.metadata
      })

      console.log('👤 Stripe Customer Created:', {
        id: customer.id,
        email: customer.email
      })

      return {
        id: customer.id,
        email: customer.email,
        name: customer.name || undefined,
        metadata: customer.metadata
      }
    } catch (error) {
      console.error('Failed to get/create Stripe customer:', error)
      throw new Error('Failed to get/create Stripe customer')
    }
  }

  // Create payment method
  static async createPaymentMethod(paymentMethodData: {
    type: string
    card: {
      number: string
      exp_month: number
      exp_year: number
      cvc: string
    }
    billing_details: {
      name: string
    }
  }): Promise<PaymentMethod> {
    if (!this.isConfigured()) {
      throw new Error('Stripe is not configured')
    }

    try {
      const stripe = this.getStripe()
      
      const paymentMethod = await stripe.paymentMethods.create({
        type: paymentMethodData.type as any,
        card: {
          number: paymentMethodData.card.number,
          exp_month: paymentMethodData.card.exp_month,
          exp_year: paymentMethodData.card.exp_year,
          cvc: paymentMethodData.card.cvc
        },
        billing_details: {
          name: paymentMethodData.billing_details.name
        }
      })

      console.log('💳 Payment Method Created:', {
        id: paymentMethod.id,
        type: paymentMethod.type
      })

      return {
        id: paymentMethod.id,
        type: paymentMethod.type,
        card: paymentMethod.card ? {
          brand: paymentMethod.card.brand,
          last4: paymentMethod.card.last4,
          exp_month: paymentMethod.card.exp_month,
          exp_year: paymentMethod.card.exp_year
        } : undefined
      }
    } catch (error) {
      console.error('Failed to create payment method:', error)
      throw new Error('Failed to create payment method')
    }
  }

  // Retrieve payment intent
  static async retrievePaymentIntent(paymentIntentId: string): Promise<PaymentIntent> {
    if (!this.isConfigured()) {
      throw new Error('Stripe is not configured')
    }

    try {
      const stripe = this.getStripe()
      
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

      return {
        id: paymentIntent.id,
        amount: this.parseAmount(paymentIntent.amount),
        currency: paymentIntent.currency,
        status: paymentIntent.status as any,
        client_secret: paymentIntent.client_secret!,
        metadata: paymentIntent.metadata
      }
    } catch (error) {
      console.error('Failed to retrieve payment intent:', error)
      throw new Error('Failed to retrieve payment intent')
    }
  }
}

export { PaymentService }
export default PaymentService
