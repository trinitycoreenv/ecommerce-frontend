import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest, handleApiError } from '@/lib/middleware'
import { PolicyService } from '@/lib/services/policy'

/**
 * GET /api/admin/violations/[id] - Get violation by ID
 */
async function getViolation(
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

    // Only admins can access violations
    if (request.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    const violation = await PolicyService.getViolationById(params.id)

    if (!violation) {
      return NextResponse.json(
        { success: false, error: 'Violation not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: violation
    })

  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * PUT /api/admin/violations/[id] - Update a violation
 */
async function updateViolation(
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

    // Only admins can update violations
    if (request.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()

    const violation = await PolicyService.updateViolation(
      params.id,
      body,
      request.user.userId
    )

    return NextResponse.json({
      success: true,
      data: violation,
      message: 'Violation updated successfully'
    })

  } catch (error) {
    return handleApiError(error)
  }
}

export const GET = withAuth(getViolation)
export const PUT = withAuth(updateViolation)

