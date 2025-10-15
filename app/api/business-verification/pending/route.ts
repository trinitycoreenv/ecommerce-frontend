import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/middleware'
import { BusinessVerificationService } from '@/lib/services/business-verification'

/**
 * GET /api/business-verification/pending - Get pending verifications
 */
async function getPendingVerifications(request: AuthenticatedRequest) {
  try {
    // Only admins can view pending verifications
    if (request.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      )
    }

    const verifications = await BusinessVerificationService.getPendingVerifications()

    return NextResponse.json({
      success: true,
      data: verifications
    })
  } catch (error) {
    console.error('Error getting pending verifications:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get pending verifications' },
      { status: 500 }
    )
  }
}

export const GET = withAuth(getPendingVerifications)
