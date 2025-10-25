import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest } from '@/lib/middleware'
import { getShippo } from '@/lib/clients/shippo'

async function toggleCarrier(request: AuthenticatedRequest) {
  try {
    // Only allow admins and operations managers
    if (!request.user || !['ADMIN', 'OPERATIONS_MANAGER'].includes(request.user.role)) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const { carrier, active } = await request.json()
    
    if (!carrier) {
      return NextResponse.json(
        { success: false, error: 'Carrier is required' },
        { status: 400 }
      )
    }

    const shippo = getShippo()
    await shippo.carrierAccounts.update(carrier, {
      accountId: carrier,
      carrier,
      active
    })

    return NextResponse.json({
      success: true,
      message: `Carrier ${active ? 'enabled' : 'disabled'} successfully`
    })
  } catch (error) {
    console.error('Error updating carrier account:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update carrier account' },
      { status: 500 }
    )
  }
}

export const POST = withAuth(toggleCarrier)