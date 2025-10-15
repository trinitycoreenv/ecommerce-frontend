import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/middleware'
import { SubscriptionService } from '@/lib/services/subscription'

/**
 * POST /api/subscriptions/[id]/upgrade - Upgrade subscription plan
 */
async function upgradeSubscription(
  request: AuthenticatedRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { newPlanId } = body

    if (!newPlanId) {
      return NextResponse.json(
        { success: false, error: 'Missing newPlanId' },
        { status: 400 }
      )
    }

    // Only vendors can upgrade their own subscription
    if (request.user.role !== 'VENDOR') {
      return NextResponse.json(
        { success: false, error: 'Only vendors can upgrade subscriptions' },
        { status: 403 }
      )
    }

    const subscription = await SubscriptionService.getVendorSubscription(request.user.userId)
    if (!subscription || subscription.id !== params.id) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      )
    }

    const upgradedSubscription = await SubscriptionService.upgradeSubscription(params.id, newPlanId)

    return NextResponse.json({
      success: true,
      data: upgradedSubscription,
      message: 'Subscription upgraded successfully'
    })
  } catch (error) {
    console.error('Error upgrading subscription:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to upgrade subscription' },
      { status: 500 }
    )
  }
}

export const POST = withAuth(upgradeSubscription)
