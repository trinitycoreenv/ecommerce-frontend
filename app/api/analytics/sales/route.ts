import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest } from '@/lib/middleware'
import { AnalyticsService } from '@/lib/services/analytics'

/**
 * GET /api/analytics/sales - Get sales analytics
 */
async function getSalesAnalytics(request: AuthenticatedRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Default to last 30 days if no dates provided
    const defaultEndDate = new Date()
    const defaultStartDate = new Date()
    defaultStartDate.setDate(defaultStartDate.getDate() - 30)

    const start = startDate ? new Date(startDate) : defaultStartDate
    const end = endDate ? new Date(endDate) : defaultEndDate

    const sales = await AnalyticsService.getSalesAnalytics(start, end)

    return NextResponse.json({
      success: true,
      data: sales
    })
  } catch (error) {
    console.error('Error getting sales analytics:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get sales analytics' },
      { status: 500 }
    )
  }
}

export const GET = withAuth(getSalesAnalytics)
