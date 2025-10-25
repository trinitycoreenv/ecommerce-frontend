import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest } from '@/lib/middleware'
import { getShippo } from '@/lib/clients/shippo'

async function getCarriers(request: AuthenticatedRequest) {
  try {
    // Only allow admins and operations managers
    if (!request.user || !['ADMIN', 'OPERATIONS_MANAGER'].includes(request.user.role)) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const shippo = getShippo()
    const accounts = await shippo.carrierAccounts.list({}, {})

    const carriers = (accounts?.results || []).map((account: any) => ({
      carrier: account.carrier,
      status: account.status,
      test: account.test,
      active: account.active
    }))

    return NextResponse.json({
      success: true,
      carriers
    })
  } catch (error) {
    console.error('Error fetching carrier accounts:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch carrier accounts' },
      { status: 500 }
    )
  }
}

export const GET = withAuth(getCarriers)