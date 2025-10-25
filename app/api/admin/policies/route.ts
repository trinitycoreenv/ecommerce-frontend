import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest, handleApiError } from '@/lib/middleware'
import { PolicyService } from '@/lib/services/policy'
import { PolicyType, PolicySeverity } from '@prisma/client'

/**
 * GET /api/admin/policies - Get all policies
 */
async function getPolicies(request: AuthenticatedRequest) {
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

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') as PolicyType | null
    const severity = searchParams.get('severity') as PolicySeverity | null
    const isActive = searchParams.get('isActive')

    const policies = await PolicyService.getPolicies({
      ...(type && { type }),
      ...(severity && { severity }),
      ...(isActive !== null && { isActive: isActive === 'true' })
    })

    return NextResponse.json({
      success: true,
      data: policies
    })

  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * POST /api/admin/policies - Create a new policy
 */
async function createPolicy(request: AuthenticatedRequest) {
  try {
    if (!request.user) {
      return NextResponse.json(
        { success: false, error: 'User not authenticated' },
        { status: 401 }
      )
    }

    // Only admins can create policies
    if (request.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, description, type, severity, rules, autoEnforce } = body

    // Validate required fields
    if (!name || !description || !type || !rules) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: name, description, type, rules' },
        { status: 400 }
      )
    }

    const policy = await PolicyService.createPolicy(
      {
        name,
        description,
        type,
        severity: severity || 'MEDIUM',
        rules,
        autoEnforce: autoEnforce || false
      },
      request.user.userId
    )

    return NextResponse.json({
      success: true,
      data: policy,
      message: 'Policy created successfully'
    }, { status: 201 })

  } catch (error) {
    return handleApiError(error)
  }
}

export const GET = withAuth(getPolicies)
export const POST = withAuth(createPolicy)

