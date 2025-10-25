import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest, handleApiError } from '@/lib/middleware'
import { PolicyService } from '@/lib/services/policy'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/vendor/violations - Get vendor's policy violations
 */
async function getVendorViolations(request: AuthenticatedRequest) {
  try {
    if (!request.user) {
      return NextResponse.json(
        { success: false, error: 'User not authenticated' },
        { status: 401 }
      )
    }

    // Only vendors can access this endpoint
    if (request.user.role !== 'VENDOR') {
      return NextResponse.json(
        { success: false, error: 'Vendor access required' },
        { status: 403 }
      )
    }

    // Get vendor ID
    const vendor = await prisma.vendor.findUnique({
      where: { userId: request.user.userId }
    })

    if (!vendor) {
      return NextResponse.json(
        { success: false, error: 'Vendor not found' },
        { status: 404 }
      )
    }

    const violations = await PolicyService.getViolations({
      vendorId: vendor.id
    })

    // Get statistics for this vendor
    const stats = await PolicyService.getViolationStats(vendor.id)

    return NextResponse.json({
      success: true,
      data: violations,
      stats: stats
    })

  } catch (error) {
    return handleApiError(error)
  }
}

export const GET = withAuth(getVendorViolations)

