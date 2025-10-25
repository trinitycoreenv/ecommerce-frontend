import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest, handleApiError } from '@/lib/middleware'
import { PolicyService } from '@/lib/services/policy'

/**
 * POST /api/products/[id]/validate - Validate a product against policies
 */
async function validateProduct(
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

    const body = await request.json()
    const { autoFlag } = body

    // Validate the product
    const result = await PolicyService.validateProduct(
      params.id,
      autoFlag || false
    )

    return NextResponse.json({
      success: true,
      data: result,
      message: result.isCompliant 
        ? 'Product is compliant with all policies' 
        : `Product has ${result.violations.length} policy violation(s)`
    })

  } catch (error) {
    return handleApiError(error)
  }
}

export const POST = withAuth(validateProduct)

