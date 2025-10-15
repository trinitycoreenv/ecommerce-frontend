import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest } from '@/lib/middleware'
import { AnalyticsService } from '@/lib/services/analytics'

/**
 * GET /api/analytics - Get comprehensive analytics report
 */
async function getAnalyticsReport(request: AuthenticatedRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const type = searchParams.get('type') as 'daily' | 'weekly' | 'monthly' | 'yearly' || 'monthly'

    // Default to last 30 days if no dates provided
    const defaultEndDate = new Date()
    const defaultStartDate = new Date()
    defaultStartDate.setDate(defaultStartDate.getDate() - 30)

    const start = startDate ? new Date(startDate) : defaultStartDate
    const end = endDate ? new Date(endDate) : defaultEndDate

    // Validate dates
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json(
        { success: false, error: 'Invalid date format' },
        { status: 400 }
      )
    }

    if (start >= end) {
      return NextResponse.json(
        { success: false, error: 'Start date must be before end date' },
        { status: 400 }
      )
    }

    const report = await AnalyticsService.getComprehensiveReport(start, end, type)

    return NextResponse.json({
      success: true,
      data: report
    })
  } catch (error) {
    console.error('Error getting analytics report:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get analytics report' },
      { status: 500 }
    )
  }
}

export const GET = withAuth(getAnalyticsReport)
