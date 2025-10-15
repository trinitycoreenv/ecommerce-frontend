import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { OrderStatus } from '@prisma/client'

// Stripe webhook handler
export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      )
    }

    // In a real implementation, you would verify the webhook signature here
    // const event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET)
    
    // For now, we'll parse the body directly (in production, use Stripe's webhook verification)
    const event = JSON.parse(body)

    console.log('Received Stripe webhook:', event.type)

    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object)
        break
      
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object)
        break
      
      case 'payment_intent.canceled':
        await handlePaymentIntentCanceled(event.data.object)
        break
      
      case 'charge.dispute.created':
        await handleChargeDisputeCreated(event.data.object)
        break
      
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: any) {
  try {
    const orderId = paymentIntent.metadata?.orderId
    
    if (!orderId) {
      console.error('No orderId found in payment intent metadata')
      return
    }

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
        paymentId: paymentIntent.id,
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

    console.log(`Payment succeeded for order ${orderId}`)

  } catch (error) {
    console.error('Error handling payment_intent.succeeded:', error)
  }
}

async function handlePaymentIntentFailed(paymentIntent: any) {
  try {
    const orderId = paymentIntent.metadata?.orderId
    
    if (!orderId) {
      console.error('No orderId found in payment intent metadata')
      return
    }

    // Update order status
    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.CANCELLED
      }
    })

    // Update transaction status
    await prisma.transaction.updateMany({
      where: { orderId: orderId },
      data: {
        status: 'FAILED',
        paymentId: paymentIntent.id
      }
    })

    console.log(`Payment failed for order ${orderId}`)

  } catch (error) {
    console.error('Error handling payment_intent.payment_failed:', error)
  }
}

async function handlePaymentIntentCanceled(paymentIntent: any) {
  try {
    const orderId = paymentIntent.metadata?.orderId
    
    if (!orderId) {
      console.error('No orderId found in payment intent metadata')
      return
    }

    // Update order status
    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.CANCELLED
      }
    })

    // Update transaction status
    await prisma.transaction.updateMany({
      where: { orderId: orderId },
      data: {
        status: 'CANCELLED',
        paymentId: paymentIntent.id
      }
    })

    console.log(`Payment canceled for order ${orderId}`)

  } catch (error) {
    console.error('Error handling payment_intent.canceled:', error)
  }
}

async function handleChargeDisputeCreated(dispute: any) {
  try {
    const paymentIntentId = dispute.payment_intent
    const order = await prisma.order.findFirst({
      where: {
        orderNumber: paymentIntentId // Simplified for now
      }
    })

    if (!order) {
      console.error('No order found for dispute payment intent:', paymentIntentId)
      return
    }

    // Create dispute record
    await prisma.auditLog.create({
      data: {
        userId: order.customerId,
        action: 'CHARGE_DISPUTE_CREATED',
        resource: 'ORDER',
        resourceId: order.id,
        details: {
          orderNumber: order.orderNumber,
          disputeId: dispute.id,
          amount: dispute.amount,
          reason: dispute.reason,
          status: dispute.status
        }
      }
    })

    // Update order notes with dispute info
    await prisma.order.update({
      where: { id: order.id },
      data: {
        notes: `Dispute created: ${dispute.reason} - Status: ${dispute.status}`
      }
    })

    console.log(`Dispute created for order ${order.orderNumber}`)

  } catch (error) {
    console.error('Error handling charge.dispute.created:', error)
  }
}
