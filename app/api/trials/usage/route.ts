import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/middleware'
import { TrialFraudPreventionService } from '@/lib/services/trial-fraud-prevention'

/**
 * GET /api/trials/usage - Get recent trial usage
 */
async function getTrialUsage(request: AuthenticatedRequest) {
  try {
    // Only admins can view trial usage
    if (request.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')

    const usage = await TrialFraudPreventionService.getRecentTrialUsage(limit)

    return NextResponse.json({
      success: true,
      data: usage
    })
  } catch (error) {
    console.error('Error fetching trial usage:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch trial usage' },
      { status: 500 }
    )
  }
}

export const GET = withAuth(getTrialUsage)
