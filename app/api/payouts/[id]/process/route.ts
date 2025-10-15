import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest } from '@/lib/middleware'
import { handleApiError } from '@/lib/middleware'
import { PayoutService } from '@/lib/services/payout'

async function processPayout(request: AuthenticatedRequest, { params }: { params: { id: string } }) {
  try {
    const payoutId = params.id

    if (!request.user) {
      return NextResponse.json(
        { success: false, error: 'User not authenticated' },
        { status: 401 }
      )
    }

    // Allow both admins and finance analysts to process payouts
    if (!['ADMIN', 'FINANCE_ANALYST'].includes(request.user.role)) {
      return NextResponse.json(
        { success: false, error: 'Admin or Finance Analyst access required' },
        { status: 403 }
      )
    }

    try {
      const success = await PayoutService.processPayout(payoutId)
      
      if (success) {
        return NextResponse.json({
          success: true,
          message: 'Payout processed successfully'
        })
      } else {
        return NextResponse.json(
          { success: false, error: 'Failed to process payout' },
          { status: 500 }
        )
      }
    } catch (error) {
      console.error('Payout processing error:', error)
      return NextResponse.json(
        { 
          success: false, 
          error: error instanceof Error ? error.message : 'Failed to process payout' 
        },
        { status: 500 }
      )
    }

  } catch (error) {
    return handleApiError(error)
  }
}

export const POST = withAuth(processPayout)
