import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest, handleApiError } from '@/lib/middleware'
import { PolicyService } from '@/lib/services/policy'

/**
 * GET /api/policies - Get all active policies (public for vendors)
 */
async function getPolicies(request: AuthenticatedRequest) {
  try {
    if (!request.user) {
      return NextResponse.json(
        { success: false, error: 'User not authenticated' },
        { status: 401 }
      )
    }

    // Get only active policies
    const policies = await PolicyService.getPolicies({
      isActive: true
    })

    // Remove sensitive information for non-admin users
    const publicPolicies = policies.map(policy => ({
      id: policy.id,
      name: policy.name,
      description: policy.description,
      type: policy.type,
      severity: policy.severity,
      rules: policy.rules,
      createdAt: policy.createdAt,
      updatedAt: policy.updatedAt
    }))

    return NextResponse.json({
      success: true,
      data: publicPolicies
    })

  } catch (error) {
    return handleApiError(error)
  }
}

export const GET = withAuth(getPolicies)

