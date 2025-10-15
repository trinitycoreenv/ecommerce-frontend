import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest } from '@/lib/middleware'
import { AnalyticsService } from '@/lib/services/analytics'

/**
 * GET /api/analytics/vendors - Get vendor performance analytics
 */
async function getVendorAnalytics(request: AuthenticatedRequest) {
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

    const vendors = await AnalyticsService.getVendorPerformance(start, end)

    return NextResponse.json({
      success: true,
      data: vendors
    })
  } catch (error) {
    console.error('Error getting vendor analytics:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get vendor analytics' },
      { status: 500 }
    )
  }
}

export const GET = withAuth(getVendorAnalytics)
