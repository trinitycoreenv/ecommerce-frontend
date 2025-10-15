import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/middleware'
import { BusinessVerificationService } from '@/lib/services/business-verification'
import { EmailService } from '@/lib/email'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/business-verification/[id]/approve - Approve business verification
 */
async function approveVerification(
  request: AuthenticatedRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Only admins can approve verifications
    if (request.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { notes } = body

    const verification = await BusinessVerificationService.approveVerification(
      params.id,
      request.user.userId,
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
          status: 'APPROVED',
          notes
        })
      }
    } catch (emailError) {
      console.error('Failed to send approval email:', emailError)
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      data: verification,
      message: 'Business verification approved successfully'
    })
  } catch (error) {
    console.error('Error approving verification:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to approve verification' },
      { status: 500 }
    )
  }
}

export const POST = withAuth(approveVerification)
