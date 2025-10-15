import { NextRequest, NextResponse } from 'next/server'
import { PaymentService } from '@/lib/payment-service'
import { prisma } from '@/lib/prisma'
import { withAuth, AuthenticatedRequest } from '@/lib/middleware'

/**
 * POST /api/subscriptions/create - Create a Stripe subscription
 */
async function createSubscription(request: AuthenticatedRequest) {
  try {
    const body = await request.json()
    const { 
      planId, 
      planName, 
      amount, 
      currency = 'usd', 
      hasFreeTrial = false, 
      trialDays = 14,
      paymentMethodId,
      customerId
    } = body

    // Validate required fields
    if (!planId || !planName || !amount || !paymentMethodId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: planId, planName, amount, paymentMethodId' },
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

    const stripe = PaymentService.getStripe()
    
    // Use provided customer ID or find/create customer
    let customer
    if (customerId) {
      try {
        customer = await stripe.customers.retrieve(customerId)
        console.log('Using provided customer:', customer.id)
      } catch (error) {
        console.error('Error retrieving customer:', error)
        throw new Error('Customer not found')
      }
    } else {
      // Try to find existing customer or create new one
      try {
        const existingCustomers = await stripe.customers.list({
          email: 'vendor@example.com',
          limit: 1
        })
        
        if (existingCustomers.data.length > 0) {
          customer = existingCustomers.data[0]
          console.log('Using existing customer:', customer.id)
        } else {
          customer = await stripe.customers.create({
            email: 'vendor@example.com', // This should come from auth
            name: 'Vendor User', // This should come from auth
            metadata: {
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
    }

    // Attach payment method to customer (handle if already attached)
    try {
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: customer.id,
      })
    } catch (attachError: any) {
      // If payment method is already attached to this customer, that's fine
      if (attachError.code === 'payment_method_already_attached') {
        console.log('Payment method already attached to customer')
      } else {
        // If attached to different customer, detach and reattach
        if (attachError.code === 'resource_already_exists') {
          console.log('Payment method attached to different customer, reattaching...')
          // Detach from previous customer and attach to new one
          await stripe.paymentMethods.detach(paymentMethodId)
          await stripe.paymentMethods.attach(paymentMethodId, {
            customer: customer.id,
          })
        } else {
          throw attachError
        }
      }
    }

    // Set as default payment method
    await stripe.customers.update(customer.id, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    })

    // Create product and price if they don't exist
    let product = await stripe.products.list({
      limit: 100,
      active: true
    })
    
    // Filter by metadata manually since list doesn't support metadata filter
    product = {
      data: product.data.filter(p => p.metadata?.planId === planId)
    }

    console.log('Product search result:', {
      totalProducts: product.data.length,
      planId,
      foundProducts: product.data.map(p => ({ id: p.id, name: p.name, metadata: p.metadata }))
    })

    if (product.data.length === 0) {
      const newProduct = await stripe.products.create({
        name: planName,
        description: `Subscription plan for ${planName}`,
        metadata: { planId }
      })
      product = { data: [newProduct] }
    } else {
      product = { data: [product.data[0]] }
    }

    // Ensure we have a product
    if (!product.data || product.data.length === 0) {
      throw new Error('Failed to create or find product')
    }

    let price = await stripe.prices.list({
      limit: 1,
      active: true,
      product: product.data[0].id,
      type: 'recurring',
      recurring: { interval: 'month' }
    })

    console.log('Price search result:', {
      totalPrices: price.data.length,
      productId: product.data[0].id,
      foundPrices: price.data.map(p => ({ id: p.id, amount: p.unit_amount, currency: p.currency }))
    })

    if (price.data.length === 0) {
      const newPrice = await stripe.prices.create({
        unit_amount: Math.round(amount * 100), // Convert to cents
        currency: currency.toLowerCase(),
        recurring: { interval: 'month' },
        product: product.data[0].id,
        metadata: { planId }
      })
      price = { data: [newPrice] }
      console.log('Created new recurring price:', { id: newPrice.id, amount: newPrice.unit_amount, recurring: newPrice.recurring })
    } else {
      price = { data: [price.data[0]] }
      console.log('Using existing price:', { id: price.data[0].id, amount: price.data[0].unit_amount, recurring: price.data[0].recurring })
    }

    // Ensure we have a price
    if (!price.data || price.data.length === 0) {
      throw new Error('Failed to create or find price')
    }

    // Create subscription
    const subscriptionData: any = {
      customer: customer.id,
      items: [{ price: price.data[0].id }],
      default_payment_method: paymentMethodId,
      metadata: {
        planId,
        planName,
        type: 'vendor_subscription'
      }
    }

    console.log('Creating subscription with data:', {
      customer: customer.id,
      price: price.data[0].id,
      paymentMethod: paymentMethodId,
      metadata: subscriptionData.metadata
    })

    // Add trial if specified
    if (hasFreeTrial) {
      subscriptionData.trial_period_days = trialDays
    }

    const subscription = await stripe.subscriptions.create(subscriptionData)

    console.log('📋 Subscription Created:', {
      id: subscription.id,
      planId,
      planName,
      amount,
      status: subscription.status
    })

    // Save subscription to database
    try {
      // Get user ID from authenticated request
      if (!request.user) {
        throw new Error('User not authenticated')
      }
      const userId = request.user.userId
      
      // Get or create vendor profile
      let vendor = await prisma.vendor.findFirst({
        where: { userId: userId }
      })

      if (!vendor) {
        // Create a basic vendor profile for testing
        vendor = await prisma.vendor.create({
          data: {
            userId: userId,
            businessName: 'Test Vendor',
            businessType: 'E-commerce',
            status: 'ACTIVE'
          }
        })
        console.log('Created vendor profile:', vendor.id)
      }

      // Get subscription plan by name (since frontend sends random UUID)
      const subscriptionPlan = await prisma.subscriptionPlan.findFirst({
        where: { 
          OR: [
            { id: planId },
            { name: planName }
          ]
        }
      })

      if (!subscriptionPlan) {
        console.warn('Subscription plan not found in database:', { planId, planName })
        // Create a default plan if not found
        const defaultPlan = await prisma.subscriptionPlan.create({
          data: {
            name: planName,
            tier: 'PREMIUM',
            description: `Subscription plan for ${planName}`,
            price: amount,
            billingCycle: 'MONTHLY',
            commissionRate: 8.0,
            maxProducts: 200,
            maxOrders: 500,
            features: ['Advanced features', 'Priority support', '14-day free trial'],
            isActive: true,
            isPopular: true,
            trialDays: hasFreeTrial ? trialDays : 0
          }
        })
        console.log('Created default subscription plan:', defaultPlan.id)
      }

      // Create subscription record in database
      const dbSubscription = await prisma.subscription.create({
        data: {
          vendorId: vendor.id,
          planId: subscriptionPlan?.id || planId,
          tier: subscriptionPlan?.tier || 'PREMIUM',
          startDate: new Date(),
          status: 'ACTIVE',
          price: amount,
          billingCycle: 'MONTHLY',
          nextBillingDate: subscription.current_period_end ? new Date(subscription.current_period_end * 1000) : undefined,
          trialEndDate: subscription.trial_end ? new Date(subscription.trial_end * 1000) : undefined,
          stripeSubscriptionId: subscription.id,
          stripeCustomerId: customer.id,
          autoRenew: true
        }
      })

      console.log('💾 Database subscription created:', {
        id: dbSubscription.id,
        vendorId: vendor.id,
        stripeSubscriptionId: subscription.id,
        status: dbSubscription.status
      })
    } catch (dbError) {
      console.error('Failed to save subscription to database:', dbError)
      // Continue with Stripe response even if database save fails
    }

    return NextResponse.json({
      success: true,
      data: {
        subscriptionId: subscription.id,
        customerId: customer.id,
        status: subscription.status,
        planId,
        planName,
        amount,
        currency,
        hasFreeTrial,
        trialDays
      }
    })

  } catch (error) {
    console.error('Error creating subscription:', error)
    
    // Return more specific error message
    const errorMessage = error instanceof Error ? error.message : 'Failed to create subscription'
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}

export const POST = withAuth(createSubscription)
