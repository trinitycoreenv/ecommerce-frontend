import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest, handleApiError } from '@/lib/middleware'
import { PolicyService } from '@/lib/services/policy'

/**
 * GET /api/admin/policies/[id] - Get policy by ID
 */
async function getPolicy(
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

    // Only admins can access policies
    if (request.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    const policy = await PolicyService.getPolicyById(params.id)

    if (!policy) {
      return NextResponse.json(
        { success: false, error: 'Policy not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: policy
    })

  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * PUT /api/admin/policies/[id] - Update a policy
 */
async function updatePolicy(
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

    // Only admins can update policies
    if (request.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()

    const policy = await PolicyService.updatePolicy(
      params.id,
      body,
      request.user.userId
    )

    return NextResponse.json({
      success: true,
      data: policy,
      message: 'Policy updated successfully'
    })

  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * DELETE /api/admin/policies/[id] - Delete a policy
 */
async function deletePolicy(
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

    // Only admins can delete policies
    if (request.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    await PolicyService.deletePolicy(params.id, request.user.userId)

    return NextResponse.json({
      success: true,
      message: 'Policy deleted successfully'
    })

  } catch (error) {
    return handleApiError(error)
  }
}

export const GET = withAuth(getPolicy)
export const PUT = withAuth(updatePolicy)
export const DELETE = withAuth(deletePolicy)

