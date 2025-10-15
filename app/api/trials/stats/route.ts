import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/middleware'
import { TrialFraudPreventionService } from '@/lib/services/trial-fraud-prevention'

/**
 * GET /api/trials/stats - Get trial usage statistics
 */
async function getTrialStats(request: AuthenticatedRequest) {
  try {
    // Only admins can view trial stats
    if (request.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      )
    }

    const stats = await TrialFraudPreventionService.getTrialStats()

    return NextResponse.json({
      success: true,
      data: stats
    })
  } catch (error) {
    console.error('Error fetching trial stats:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch trial stats' },
      { status: 500 }
    )
  }
}

export const GET = withAuth(getTrialStats)
