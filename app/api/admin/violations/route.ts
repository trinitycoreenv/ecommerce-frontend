import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest, handleApiError } from '@/lib/middleware'
import { PolicyService } from '@/lib/services/policy'
import { ViolationStatus } from '@prisma/client'

/**
 * GET /api/admin/violations - Get all policy violations
 */
async function getViolations(request: AuthenticatedRequest) {
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

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') as ViolationStatus | null
    const vendorId = searchParams.get('vendorId')
    const productId = searchParams.get('productId')
    const policyId = searchParams.get('policyId')

    const violations = await PolicyService.getViolations({
      ...(status && { status }),
      ...(vendorId && { vendorId }),
      ...(productId && { productId }),
      ...(policyId && { policyId })
    })

    // Get statistics
    const stats = await PolicyService.getViolationStats()

    return NextResponse.json({
      success: true,
      data: violations,
      stats: stats
    })

  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * POST /api/admin/violations - Create a new violation (manual flagging)
 */
async function createViolation(request: AuthenticatedRequest) {
  try {
    if (!request.user) {
      return NextResponse.json(
        { success: false, error: 'User not authenticated' },
        { status: 401 }
      )
    }

    // Only admins can create violations
    if (request.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { policyId, productId, vendorId, reason, details } = body

    // Validate required fields
    if (!policyId || !productId || !vendorId || !reason) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: policyId, productId, vendorId, reason' },
        { status: 400 }
      )
    }

    const violation = await PolicyService.createViolation({
      policyId,
      productId,
      vendorId,
      reason,
      details,
      flaggedBy: request.user.userId
    })

    return NextResponse.json({
      success: true,
      data: violation,
      message: 'Violation created successfully'
    }, { status: 201 })

  } catch (error) {
    return handleApiError(error)
  }
}

export const GET = withAuth(getViolations)
export const POST = withAuth(createViolation)

