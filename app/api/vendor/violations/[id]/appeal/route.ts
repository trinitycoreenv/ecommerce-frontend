import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest, handleApiError } from '@/lib/middleware'
import { PolicyService } from '@/lib/services/policy'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/vendor/violations/[id]/appeal - Appeal a violation
 */
async function appealViolation(
  request: AuthenticatedRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!request.user) {
      return NextResponse.json(
        { success: false, error: 'User not authenticated' },
        { status: 401 }
      )
    }

    // Only vendors can appeal violations
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

    const body = await request.json()
    const { appealMessage, appealDocuments } = body

    if (!appealMessage) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: appealMessage' },
        { status: 400 }
      )
    }

    const violation = await PolicyService.appealViolation(
      params.id,
      {
        appealMessage,
        appealDocuments
      },
      vendor.id
    )

    return NextResponse.json({
      success: true,
      data: violation,
      message: 'Appeal submitted successfully'
    })

  } catch (error) {
    return handleApiError(error)
  }
}

export const POST = withAuth(appealViolation)

