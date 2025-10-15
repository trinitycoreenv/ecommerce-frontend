import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest } from '@/lib/middleware'
import { ShippingService } from '@/lib/services/shipping'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/shipping/stats - Get shipping statistics
 */
async function getShippingStats(request: AuthenticatedRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const vendorId = searchParams.get('vendorId')

    // Only allow vendors to see their own stats, or admins to see all
    const targetVendorId = request.user.role === 'VENDOR' ? request.user.userId : vendorId || undefined

    const stats = await ShippingService.getShippingStats(targetVendorId)

    return NextResponse.json({
      success: true,
      data: stats
    })
  } catch (error) {
    console.error('Error getting shipping stats:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get shipping statistics' },
      { status: 500 }
    )
  }
}

export const GET = withAuth(getShippingStats)
