import { NextRequest, NextResponse } from 'next/server'
import { PaymentService } from '@/lib/payment-service'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/payments/create-intent - Create a Stripe payment intent
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId, amount, currency = 'php' } = body

    // Validate required fields
    if (!orderId || !amount) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: orderId, amount' },
        { status: 400 }
      )
    }

    // Validate amount
    if (amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Amount must be greater than 0' },
        { status: 400 }
      )
    }

    // Check if Stripe is configured
    if (!PaymentService.isConfigured()) {
      return NextResponse.json(
        { success: false, error: 'Payment service not configured' },
        { status: 500 }
      )
    }

    // Get order to find customer info
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: true
      }
    })

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      )
    }

    // Get or create Stripe customer
    const customer = await PaymentService.getOrCreateCustomer({
      email: order.customer.email,
      name: order.customer.name,
      metadata: {
        userId: order.customerId,
        orderId: orderId
      }
    })

    // Create payment intent
    const paymentIntent = await PaymentService.createPaymentIntent({
      amount: amount,
      currency: currency,
      orderId: orderId,
      customerId: customer.id,
      vendorId: 'platform', // This would be determined from the order
      metadata: {
        userId: order.customerId,
        userEmail: order.customer.email,
        userName: order.customer.name
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status
      }
    })

  } catch (error) {
    console.error('Error creating payment intent:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create payment intent' },
      { status: 500 }
    )
  }
}