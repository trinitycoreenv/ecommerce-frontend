import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/middleware'
import { SubscriptionService } from '@/lib/services/subscription'

/**
 * PUT /api/subscriptions/[id] - Update subscription
 */
async function updateSubscription(
  request: AuthenticatedRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { planId, status, autoRenew, stripeSubscriptionId } = body

    // Only vendors can update their own subscription or admins can update any
    if (request.user.role === 'VENDOR') {
      const subscription = await SubscriptionService.getVendorSubscription(request.user.userId)
      if (!subscription || subscription.id !== params.id) {
        return NextResponse.json(
          { success: false, error: 'Access denied' },
          { status: 403 }
        )
      }
    } else if (request.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      )
    }

    const updatedSubscription = await SubscriptionService.updateSubscription(params.id, {
      planId,
      status,
      autoRenew,
      stripeSubscriptionId
    })

    return NextResponse.json({
      success: true,
      data: updatedSubscription
    })
  } catch (error) {
    console.error('Error updating subscription:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update subscription' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/subscriptions/[id] - Cancel subscription
 */
async function cancelSubscription(
  request: AuthenticatedRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Only vendors can cancel their own subscription or admins can cancel any
    if (request.user.role === 'VENDOR') {
      const subscription = await SubscriptionService.getVendorSubscription(request.user.userId)
      if (!subscription || subscription.id !== params.id) {
        return NextResponse.json(
          { success: false, error: 'Access denied' },
          { status: 403 }
        )
      }
    } else if (request.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      )
    }

    await SubscriptionService.cancelSubscription(params.id)

    return NextResponse.json({
      success: true,
      message: 'Subscription cancelled successfully'
    })
  } catch (error) {
    console.error('Error cancelling subscription:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to cancel subscription' },
      { status: 500 }
    )
  }
}

export const PUT = withAuth(updateSubscription)
export const DELETE = withAuth(cancelSubscription)