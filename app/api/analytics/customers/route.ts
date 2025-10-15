import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest } from '@/lib/middleware'
import { AnalyticsService } from '@/lib/services/analytics'

/**
 * GET /api/analytics/customers - Get customer analytics
 */
async function getCustomerAnalytics(request: AuthenticatedRequest) {
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

    const customers = await AnalyticsService.getCustomerAnalytics(start, end)

    return NextResponse.json({
      success: true,
      data: customers
    })
  } catch (error) {
    console.error('Error getting customer analytics:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get customer analytics' },
      { status: 500 }
    )
  }
}

export const GET = withAuth(getCustomerAnalytics)
