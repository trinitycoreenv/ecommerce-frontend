import { NextRequest, NextResponse } from 'next/server'
import { SubscriptionService } from '@/lib/services/subscription'

/**
 * GET /api/subscription-plans - Get all available subscription plans
 */
export async function GET(request: NextRequest) {
  try {
    const plans = await SubscriptionService.getAvailablePlans()

    return NextResponse.json({
      success: true,
      data: plans
    })
  } catch (error) {
    console.error('Error getting subscription plans:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get subscription plans' },
      { status: 500 }
    )
  }
}
