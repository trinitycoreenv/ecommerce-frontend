import { NextRequest, NextResponse } from 'next/server'
import { PaymentService } from '@/lib/payment-service'
import { prisma } from '@/lib/prisma'
import { withAuth, AuthenticatedRequest } from '@/lib/middleware'

/**
 * POST /api/subscriptions/create-setup-intent - Create a Stripe setup intent for subscription
 */
async function createSetupIntent(request: AuthenticatedRequest) {
  try {
    const body = await request.json()
    const { planId, planName, amount, currency = 'usd', hasFreeTrial = false, trialDays = 14 } = body

    // Validate required fields
    if (!planId || !planName || !amount) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: planId, planName, amount' },
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

    // Get current user from authenticated request
    if (!request.user) {
      return NextResponse.json(
        { success: false, error: 'User not authenticated' },
        { status: 401 }
      )
    }
    
    const stripe = PaymentService.getStripe()
    
    // Try to find existing customer or create new one
    let customer
    try {
      const existingCustomers = await stripe.customers.list({
        email: request.user.email, // Use authenticated user's email
        limit: 1
      })
      
      if (existingCustomers.data.length > 0) {
        customer = existingCustomers.data[0]
        console.log('Using existing customer:', customer.id)
      } else {
        customer = await stripe.customers.create({
          email: request.user.email, // Use authenticated user's email
          name: request.user.name, // Use authenticated user's name
          metadata: {
            userId: request.user.userId,
            planId,
            planName,
            type: 'vendor_subscription'
          }
        })
        console.log('Created new customer:', customer.id)
      }
    } catch (customerError) {
      console.error('Error with customer:', customerError)
      throw new Error('Failed to get or create customer')
    }
    
    const setupIntent = await stripe.setupIntents.create({
      customer: customer.id,
      payment_method_types: ['card'],
      usage: 'off_session',
      metadata: {
        planId,
        planName,
        amount: amount.toString(),
        currency,
        hasFreeTrial: hasFreeTrial.toString(),
        trialDays: trialDays.toString()
      }
    })

    console.log('🔧 Setup Intent Created:', {
      id: setupIntent.id,
      planId,
      planName,
      amount
    })

    return NextResponse.json({
      success: true,
      data: {
        clientSecret: setupIntent.client_secret,
        setupIntentId: setupIntent.id,
        customerId: customer.id,
        planId,
        planName,
        amount,
        currency
      }
    })

  } catch (error) {
    console.error('Error creating setup intent:', error)
    
    // Return more specific error message
    const errorMessage = error instanceof Error ? error.message : 'Failed to create setup intent'
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}

export const POST = withAuth(createSetupIntent)
