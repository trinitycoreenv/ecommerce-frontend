import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest, handleApiError } from '@/lib/middleware'
import { PolicyService } from '@/lib/services/policy'

/**
 * POST /api/admin/violations/[id]/resolve - Resolve a violation
 */
async function resolveViolation(
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

    // Only admins can resolve violations
    if (request.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { approved, adminNotes } = body

    if (approved === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: approved' },
        { status: 400 }
      )
    }

    const violation = await PolicyService.resolveViolation(
      params.id,
      approved,
      adminNotes || '',
      request.user.userId
    )

    return NextResponse.json({
      success: true,
      data: violation,
      message: approved ? 'Violation resolved and approved' : 'Violation rejected'
    })

  } catch (error) {
    return handleApiError(error)
  }
}

export const POST = withAuth(resolveViolation)

