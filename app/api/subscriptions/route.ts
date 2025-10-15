import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest } from '@/lib/middleware'
import { SubscriptionService } from '@/lib/services/subscription'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/subscriptions - Create a new subscription
 */
async function createSubscription(request: AuthenticatedRequest) {
  try {
    const body = await request.json()
    const { planId, billingCycle, startTrial } = body

    // Validate required fields
    if (!planId || !billingCycle) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: planId, billingCycle' },
        { status: 400 }
      )
    }

    // Only vendors can create subscriptions
    if (request.user.role !== 'VENDOR') {
      return NextResponse.json(
        { success: false, error: 'Only vendors can create subscriptions' },
        { status: 403 }
      )
    }

    // Get vendor ID from user ID
    const vendor = await prisma.vendor.findUnique({
      where: { userId: request.user.userId }
    })

    if (!vendor) {
      return NextResponse.json(
        { success: false, error: 'Vendor profile not found' },
        { status: 404 }
      )
    }

    // Check if vendor already has an active subscription
    const existingSubscription = await SubscriptionService.getVendorSubscription(vendor.id)
    if (existingSubscription) {
      return NextResponse.json(
        { success: false, error: 'Vendor already has an active subscription' },
        { status: 400 }
      )
    }

    const subscription = await SubscriptionService.createSubscription({
      vendorId: vendor.id,
      planId,
      billingCycle,
      startTrial: startTrial || false
    })

    return NextResponse.json({
      success: true,
      data: subscription
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating subscription:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create subscription' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/subscriptions - Get user's subscription
 */
async function getSubscription(request: AuthenticatedRequest) {
  try {
    // Only vendors can view their subscription
    if (request.user.role !== 'VENDOR') {
      return NextResponse.json(
        { success: false, error: 'Only vendors can view subscriptions' },
        { status: 403 }
      )
    }

    // Get vendor ID from user ID
    const vendor = await prisma.vendor.findUnique({
      where: { userId: request.user.userId }
    })

    if (!vendor) {
      return NextResponse.json(
        { success: false, error: 'Vendor profile not found' },
        { status: 404 }
      )
    }

    const subscription = await SubscriptionService.getVendorSubscription(vendor.id)

    return NextResponse.json({
      success: true,
      data: subscription
    })
  } catch (error) {
    console.error('Error getting subscription:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get subscription' },
      { status: 500 }
    )
  }
}

export const POST = withAuth(createSubscription)
export const GET = withAuth(getSubscription)