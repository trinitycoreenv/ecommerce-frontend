import { NextRequest, NextResponse } from 'next/server'
import { PaymentService } from '@/lib/payment-service'
import { prisma } from '@/lib/prisma'
import { OrderStatus } from '@prisma/client'

/**
 * POST /api/payments/confirm - Confirm a Stripe payment intent
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { paymentIntentId, orderId } = body

    // Validate required fields
    if (!paymentIntentId || !orderId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: paymentIntentId, orderId' },
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

    // Retrieve payment intent to check status
    const paymentIntent = await PaymentService.retrievePaymentIntent(paymentIntentId)

    if (paymentIntent.status === 'succeeded') {
      // Update order status
      await prisma.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.CONFIRMED
        }
      })

      // Update transaction status
      await prisma.transaction.updateMany({
        where: { orderId: orderId },
        data: {
          status: 'COMPLETED',
          paymentId: paymentIntentId,
          processedAt: new Date()
        }
      })

      // Process commission
      try {
        const { CommissionService } = await import('@/lib/services/commission')
        await CommissionService.processCommission(orderId)
      } catch (commissionError) {
        console.error('Failed to process commission:', commissionError)
      }

      return NextResponse.json({
        success: true,
        data: {
          paymentIntentId: paymentIntent.id,
          status: paymentIntent.status,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency
        }
      })
    } else {
      return NextResponse.json(
        { success: false, error: 'Payment not successful' },
        { status: 400 }
      )
    }

    } catch (error) {
    console.error('Error confirming payment:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to confirm payment' },
        { status: 500 }
      )
  }
}
