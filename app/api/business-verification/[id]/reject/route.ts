import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/middleware'
import { BusinessVerificationService } from '@/lib/services/business-verification'
import { EmailService } from '@/lib/email'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/business-verification/[id]/reject - Reject business verification
 */
async function rejectVerification(
  request: AuthenticatedRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Only admins can reject verifications
    if (request.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { rejectionReason, notes } = body

    if (!rejectionReason) {
      return NextResponse.json(
        { success: false, error: 'Rejection reason is required' },
        { status: 400 }
      )
    }

    const verification = await BusinessVerificationService.rejectVerification(
      params.id,
      request.user.userId,
      rejectionReason,
      notes
    )

    // Send email notification
    try {
      const vendor = await prisma.vendor.findUnique({
        where: { id: verification.vendorId },
        include: { user: true }
      })

      if (vendor?.user?.email) {
        await EmailService.sendBusinessVerificationUpdate({
          email: vendor.user.email,
          name: vendor.user.name || 'Vendor',
          businessName: vendor.businessName,
          status: 'REJECTED',
          rejectionReason,
          notes
        })
      }
    } catch (emailError) {
      console.error('Failed to send rejection email:', emailError)
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      data: verification,
      message: 'Business verification rejected'
    })
  } catch (error) {
    console.error('Error rejecting verification:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to reject verification' },
      { status: 500 }
    )
  }
}

export const POST = withAuth(rejectVerification)
