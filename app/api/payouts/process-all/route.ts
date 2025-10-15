import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest } from '@/lib/middleware'
import { handleApiError } from '@/lib/middleware'
import { PayoutService } from '@/lib/services/payout'

async function processAllPayouts(request: AuthenticatedRequest) {
  try {
    if (!request.user) {
      return NextResponse.json(
        { success: false, error: 'User not authenticated' },
        { status: 401 }
      )
    }

    if (!['ADMIN', 'FINANCE_ANALYST'].includes(request.user.role)) {
      return NextResponse.json(
        { success: false, error: 'Admin or Finance Analyst access required' },
        { status: 403 }
      )
    }

    try {
      const result = await PayoutService.processAllProcessingPayouts()
      
      return NextResponse.json({
        success: true,
        data: result,
        message: `Processed ${result.processed} payouts, ${result.failed} failed, ${result.skipped} skipped`
      })
    } catch (error) {
      console.error('Bulk payout processing error:', error)
      return NextResponse.json(
        { 
          success: false, 
          error: error instanceof Error ? error.message : 'Failed to process payouts' 
        },
        { status: 500 }
      )
    }

  } catch (error) {
    return handleApiError(error)
  }
}

async function retryFailedPayouts(request: AuthenticatedRequest) {
  try {
    if (!request.user) {
      return NextResponse.json(
        { success: false, error: 'User not authenticated' },
        { status: 401 }
      )
    }

    if (!['ADMIN', 'FINANCE_ANALYST'].includes(request.user.role)) {
      return NextResponse.json(
        { success: false, error: 'Admin or Finance Analyst access required' },
        { status: 403 }
      )
    }

    try {
      const retried = await PayoutService.retryFailedPayouts()
      
      return NextResponse.json({
        success: true,
        data: { retried },
        message: `Retried ${retried} failed payouts`
      })
    } catch (error) {
      console.error('Retry failed payouts error:', error)
      return NextResponse.json(
        { 
          success: false, 
          error: error instanceof Error ? error.message : 'Failed to retry payouts' 
        },
        { status: 500 }
      )
    }

  } catch (error) {
    return handleApiError(error)
  }
}

export const POST = withAuth(processAllPayouts)
export const PUT = withAuth(retryFailedPayouts)
